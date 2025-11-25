import { Body, Controller, Get, HttpException, HttpStatus, InternalServerErrorException, NotFoundException, Param, Post, Put, Res, UseGuards } from '@nestjs/common';
import { ReplayService } from './replay.service';
import { CreateReplayDto, UpdateReplayDto } from './DTOs/replay.dto';
import { Replay } from './entities/replay.entity';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { Response } from 'express';
import { ReplayStatus } from './enum/replay_status.enum';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@ApiTags('replays')
@Controller('replays')
export class ReplayController {
    constructor(private readonly replayService: ReplayService) { }


    @Post('start_recording')
    @ApiOperation({ summary: 'Commancer l\'enregistrement vidéo' })
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

    @Put('confname/:conference_name/end_recording')
    @ApiOperation({ summary: 'Arrêter l\'enregistrement vidéo' })
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

    @Put(':uid/end_recording')
    @ApiOperation({ summary: 'Update replay par UID' })
    async updateReplayByUID(
        @Param('uid') uid: string,
        @Body() updateReplayDto: UpdateReplayDto,
    ) {
        try {
            const replay = await this.replayService.updateReplayByUID(uid, updateReplayDto);

            const isEnabled = process.env.ENABLE_JIBRI_APITECH_API === 'true';

            if (isEnabled && replay.status === ReplayStatus.UPLOADED_RSYNC) {
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
                    updateReplayDto.status = ReplayStatus.TERMINATED;
                } else {
                    updateReplayDto.status = ReplayStatus.ERROR_UPLOADING_RSYNC;
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

    @UseGuards(JwtAuthGuard)
    @Get('download/:uid')
    @ApiOperation({ summary: 'Télécharger la vidéo' })
    async downloadVideo(
        @Param('uid') uid: string,
        @Res() res: Response,
    ) {
        const replay = await this.replayService.findReplayByUID(uid);
        if (!replay) {
            throw new HttpException('Replay introuvable', HttpStatus.NOT_FOUND);
        }
        const { path: filePath, stat, safeFilename } = this.replayService.downloadVideoFile(replay.file_path);

        const stream = fs.createReadStream(filePath);

        res.set({
            'Content-Disposition': `attachment; filename="${safeFilename}"`,
            'Content-Type': 'video/mp4',
            'Content-Length': stat.size,
        });

        stream.pipe(res);
    }

    @UseGuards(JwtAuthGuard)
    @Get('')
    @ApiOperation({ summary: 'Lister tous les replays groupés par conférence' })
    async findAllGroupedByConference() {
        const replays = await this.replayService.findAll();
        // Grouper par nom de conférence (conference_name ou 'no_conference' si absent)
        const grouped = {};
        for (const replay of replays) {
            const key = replay.conference_name || 'no_conference';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(replay);
        }
        return grouped;
    }

    @UseGuards(JwtAuthGuard)
    @Get('conference/:conference_uid')
    @ApiOperation({ summary: 'Obtenir un replay par UID de conférence' })
    async getByLatestConfUID(@Param('conference_uid') conference_uid: string) {
        return this.replayService.findByLatestConferenceUID(conference_uid);
    }

    @Post(':confname/register_eventid')
    @ApiOperation({ summary: 'Enregistrer un event ID pour une conférence' })
    async register_eventid(
        @Param('confname') confname: string,
        @Body()
        body: {
            eventid: string;
            jwt: string;
            uploadCallbackUrl: string;
            uploadCallbackDomainUrl: string;
        },
    ) {
        const { eventid, jwt, uploadCallbackUrl, uploadCallbackDomainUrl } = body;

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

        return {
            message: `L'eventid '${eventid}' est enregistré pour la conf '${confname}'`,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':conference_name')
    @ApiOperation({ summary: 'Obtenir un replay par nom de conférence' })
    async findReplayByConfName(@Param('conference_name') conference_name: string): Promise<Replay> {
        try {
            const replay = await this.replayService.findReplayByConfName(conference_name);

            if (!replay) {
                throw new NotFoundException('Aucun replay trouvé');
            }

            return replay;
        } catch (error) {
            console.error("Erreur lors de la récupération du replay :", error.message);
            if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException(error.message);
        }
    }
}
