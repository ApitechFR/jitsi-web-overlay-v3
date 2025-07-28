import { Body, Controller, Get, HttpException, HttpStatus, InternalServerErrorException, NotFoundException, Param, Post, Put, Query, Res } from '@nestjs/common';
import { ReplayService } from './replay.service';
import { CreateReplayDto, UpdateReplayDto } from './DTOs/replay.dto';
import { Replay } from './entities/replay.entity';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { Response } from 'express';
import * as path from 'path';

@Controller('api/visioreplay')
export class ReplayController {
    constructor(private readonly replayService: ReplayService) { }

    @Post('start_recording')
    async createReplay(@Body() data: CreateReplayDto): Promise<Replay> {
        try {
            return await this.replayService.createReplay(data);
        } catch (error) {
            throw new HttpException(
                { message: 'Cannot create replay', error: error.message },
                error.status ?? HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Put('end_recording/confname/:conference_name')
    async updateReplayByConfName(
        @Param('conference_name') conference_name: string,
        @Body() data: UpdateReplayDto,
    ) {
        try {
            const updatedReplay = await this.replayService.updateReplayByConfName(conference_name, data);
            return { status: updatedReplay.status };
        } catch (error) {
            throw new HttpException(
                { message: 'Cannot find replay', error: error.message },
                error.status ?? HttpStatus.NOT_FOUND,
            );
        }
    }

    @Put('end_recording/:uid')
    async updateReplayByUID(
        @Param('uid') uid: string,
        @Body() updateReplayDto: UpdateReplayDto,
    ) {
        try {
            const replay = await this.replayService.updateReplayByUID(uid, updateReplayDto);

            const isEnabled = process.env.ENABLE_JIBRI_APITECH_API === 'true';

            if (isEnabled && replay.status === 'uploaded-rsync') {
                const confname = replay.conference_name;
                const file = replay.file_path;

                if (!confname || !file) {
                    throw new HttpException(
                        { message: 'Paramètres manquants.' },
                        HttpStatus.BAD_REQUEST,
                    );
                }

                const registerEvent = await this.replayService.findRegisterEventByConfname(confname);

                if (!registerEvent) {
                    throw new HttpException(
                        { message: `Aucun enregistrement trouvé pour la conférence '${confname}'.` },
                        HttpStatus.NOT_FOUND,
                    );
                }

                const eventid = registerEvent.eventid;
                const jwt = registerEvent.jwt;
                const uploadCallbackUrl = registerEvent.uploadCallbackUrl.startsWith('/')
                    ? registerEvent.uploadCallbackUrl
                    : '/' + registerEvent.uploadCallbackUrl;
                const uploadCallbackDomainUrl = registerEvent.uploadCallbackDomainUrl.replace('/', '');

                // Préparation du FormData
                const form = new FormData();
                form.append('eventId', eventid);
                form.append('type', 'MP4');
                form.append('apiId', `${eventid}111_${confname}`);
                form.append('file', fs.createReadStream(file));

                // Fusion des headers
                const headers = {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${jwt}`,
                };

                // Fonction promisifiée pour gérer form.submit avec await
                const uploadResult = await new Promise<{ statusCode: number; responseBody: string }>((resolve, reject) => {
                    form.submit(
                        {
                            method: 'PUT',
                            protocol: 'https:',
                            host: uploadCallbackDomainUrl,
                            path: uploadCallbackUrl,
                            headers,
                        },
                        (err, httpRes) => {
                            if (err) return reject(err);

                            let responseData = '';
                            httpRes.on('data', (chunk) => {
                                responseData += chunk;
                            });

                            httpRes.on('end', () => {
                                resolve({ statusCode: httpRes.statusCode ?? 500, responseBody: responseData });
                            });
                        },
                    );
                });

                // Mise à jour du statut selon la réponse
                if (uploadResult.statusCode >= 200 && uploadResult.statusCode < 300) {
                    updateReplayDto.status = 'terminated';
                } else {
                    updateReplayDto.status = 'error-uploading-rsync';
                }

                const updatedReplay = await this.replayService.updateReplayByUID(uid, updateReplayDto);

                return { status: updatedReplay.status, message: uploadResult.responseBody };
            } else {
                return { status: replay.status };
            }

        } catch (error) {
            throw new HttpException(
                { message: 'Cannot find replay', error: error.message },
                error.status ?? HttpStatus.NOT_FOUND,
            );
        }
    }

    @Get('findReplay/:conference_name')
    async findReplayByConfName(@Param('conference_name') conference_name: string): Promise<Replay> {
        try {
            const replay = await this.replayService.findReplayByConfName(conference_name);

            if (!replay) {
                throw new NotFoundException('Aucun replay trouvé');
            }

            return replay;
        } catch (error) {
            console.error("Erreur lors de la récupération du replay :", error.message);
            throw new InternalServerErrorException(error.message);
        }
    }

    @Get('register_eventid/:confname')
    async register_eventid(
        @Param('confname') confname: string,
        @Query('eventid') eventid: string,
        @Query('jwt') jwt: string,
        @Query('uploadcallbackurl') uploadCallbackUrl: string,
        @Query('uploadcallbackdomainurl') uploadCallbackDomainUrl: string,
    ) {
        if (!eventid || !jwt || !uploadCallbackUrl || !uploadCallbackDomainUrl) {
            throw new HttpException(
                { message: 'Certains paramètres sont manquants.' },
                HttpStatus.BAD_REQUEST,
            );
        }

        await this.replayService.registerEventId({
            confname,
            eventid,
            jwt,
            uploadCallbackUrl,
            uploadCallbackDomainUrl,
        });

        console.log({ confname, eventid, jwt, uploadCallbackUrl, uploadCallbackDomainUrl });

        return {
            message: `L'eventid '${eventid}' est enregistré pour la conf '${confname}'`,
        };
    }

    @Get('video')
    downloadVideo(
        @Query('path') rawPath: string,
        @Res() res: Response,
    ) {
        const decodedPath = decodeURIComponent(rawPath || '').trim();

        if (!decodedPath || !fs.existsSync(decodedPath)) {
            throw new HttpException('Fichier introuvable', HttpStatus.NOT_FOUND);
        }

        const stat = fs.statSync(decodedPath);
        const stream = fs.createReadStream(decodedPath);
        const safeFilename = path.basename(decodedPath);

        console.log('Chemin fichier reçu:', decodedPath);

        res.set({
            'Content-Disposition': `attachment; filename="${safeFilename}"`,
            'Content-Type': 'video/mp4',
            'Content-Length': stat.size,
        });

        stream.pipe(res);
    }


    @Get('replay')
    async findAll(): Promise<Replay[]> {
        return this.replayService.findAll();
    }

    @Get('replay/:conference_uid')
    async getByLatestConfUID(@Param('conference_uid') conference_uid: string) {
        return this.replayService.findByLatestConferenceUID(conference_uid);
    }
}
