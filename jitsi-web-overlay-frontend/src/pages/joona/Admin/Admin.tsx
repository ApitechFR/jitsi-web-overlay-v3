import Breadcrumb from "@apitechfr/react-dsapitech/Breadcrumb";
import Input from '@apitechfr/react-dsapitech/Input';
import { Select } from "@apitechfr/react-dsapitech/Select";
import { Upload } from "@apitechfr/react-dsapitech/Upload";
import { ToggleSwitch } from "@apitechfr/react-dsapitech/ToggleSwitch";

import { useEffect, useMemo, useState } from 'react';

import styles from './Admin.module.css'

function Admin() {

    const [timeZones, setTimeZones] = useState<string[]>([]);
    // const [localTimeZone, setLocalTimeZone] = useState<string>('');

    useEffect(() => {
        if (typeof Intl === 'undefined' || !Intl.supportedValuesOf) {
            console.warn('Intl.supportedValuesOf not supported in this environment.');
            return;
        }

        const allTimeZones = Intl.supportedValuesOf('timeZone');
        // const local = Intl.DateTimeFormat().resolvedOptions().timeZone;

        setTimeZones(allTimeZones);
        // setLocalTimeZone(local);
    }, []);

    const formatOffset = (timeZone: string): string => {
        try {
            const date = new Date();
            const options: Intl.DateTimeFormatOptions = {
                timeZone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
            };
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const parts = formatter.formatToParts(date);
            const offset = parts.find(p => p.type === 'timeZoneName')?.value || '';

            return offset.replace('GMT', 'UTC');
        } catch {
            return '';
        }
    };

    const timeZonesWithOffsets = useMemo(() => {
        return timeZones.map(tz => [tz, formatOffset(tz)]);
    }, [timeZones]);

    return (
        <div className={styles.content}>
            <Breadcrumb
                currentPageLabel="Administration"
                homeLinkProps={{
                    href: '/'
                }}
                segments={[]}
            />
            <div className={styles.titleBlock}>
                <h1>Administration</h1>
            </div>
            <div className={styles.contentBlock}>
                <div className={styles.inputStyle}>
                    <Input
                        disabled
                        label='Titre du header'
                    />
                </div>
                <div className={styles.inputStyle}>
                    <Select
                        label="Fuseau horaire"
                        nativeSelectProps={{
                            name: "timezone",
                        }}
                    >
                        <option value="" disabled hidden>Sélectionnez un fuseau horaire</option>
                        {timeZonesWithOffsets.map(([tz, offset]) => (
                            <option key={tz} value={tz}>
                                {`${tz} (${offset})`}
                            </option>
                        ))}
                    </Select>
                </div>
                <Upload
                    hint="Ajoutez ou modifier le logo header"
                    state="default"
                    stateRelatedMessage="Text de validation / d'explication de l'erreur"
                    label="Logo header"
                />
                <div></div>
                <div className={styles.optionSection}>
                    <h2>Options</h2>
                    <div className={styles.toogleSwitchSection}>
                        <div className={styles.toogleSwitchBlock}>
                            <span>Enregistrement vidéo</span>
                            <div>
                                <ToggleSwitch
                                    // helperText="Texte d’aide pour clarifier l’action"
                                    inputTitle="the-title"
                                    label="Uniquement le propriétaire peut lancer"
                                    labelPosition="right"
                                    showCheckedHint
                                />
                                <hr />
                                <ToggleSwitch
                                    inputTitle="the-title"
                                    label="Uniquement le propriétaire peut télécharger"
                                    labelPosition="right"
                                    showCheckedHint
                                />
                            </div>
                        </div>
                        <div className={styles.toogleSwitchBlock}>
                            <span>Option modifiable dans les salles de réunions</span>
                            <div>
                                <ToggleSwitch
                                    inputTitle="the-title"
                                    label="Label action interrupteur"
                                    labelPosition="right"
                                    showCheckedHint
                                />
                                <hr />
                                <ToggleSwitch
                                    inputTitle="the-title"
                                    label="Label action interrupteur"
                                    labelPosition="right"
                                    showCheckedHint
                                />
                            </div>
                        </div>
                        <div className={styles.toogleSwitchBlock}>
                            <span>Personnes</span>
                            <div>
                                <ToggleSwitch
                                    inputTitle="the-title"
                                    label="Autoriser les visiteurs"
                                    labelPosition="right"
                                    showCheckedHint
                                />
                                <hr />
                                <ToggleSwitch
                                    inputTitle="the-title"
                                    label="Label action interrupteur"
                                    labelPosition="right"
                                    showCheckedHint
                                />
                            </div>
                        </div>
                        <div className={styles.toogleSwitchBlock}>
                            <span>Option modifiable dans les salles de réunions</span>
                            <div>
                                <ToggleSwitch
                                    inputTitle="the-title"
                                    label="Label action interrupteur"
                                    labelPosition="right"
                                    showCheckedHint
                                />
                                <hr />
                                <ToggleSwitch
                                    inputTitle="the-title"
                                    label="Label action interrupteur"
                                    labelPosition="right"
                                    showCheckedHint
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default Admin;