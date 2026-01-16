import { useTranslation } from 'react-i18next';
import { Select, Upload, ToggleSwitch, Input, Breadcrumb } from "@ds";

import { useEffect, useMemo, useState } from 'react';

import styles from './Admin.module.css'

function Admin() {
    const { t } = useTranslation();

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
                currentPageLabel={t('admin.title')}
                homeLinkProps={{
                    href: '/'
                }}
                segments={[]}
            />
            <div className={styles.titleBlock}>
                <h1>{t('admin.title')}</h1>
            </div>
            <div className={styles.contentBlock}>
                <div className={styles.inputStyle}>
                    <Input
                        disabled
                        label={t('admin.headerTitle')}
                    />
                </div>
                <div className={styles.inputStyle}>
                    <Select
                        label={t('admin.timezone')}
                        nativeSelectProps={{
                            name: "timezone",
                        }}
                    >
                        <option value="" disabled hidden>{t('admin.selectTimezone')}</option>
                        {timeZonesWithOffsets.map(([tz, offset]) => (
                            <option key={tz} value={tz}>
                                {`${tz} (${offset})`}
                            </option>
                        ))}
                    </Select>
                </div>
                <Upload
                    hint={t('admin.logoHint')}
                    state="default"
                    stateRelatedMessage={t('admin.logoValidation')}
                    label={t('admin.logoLabel')}
                />
                <div></div>
                <div className={styles.optionSection}>
                    <h2>{t('admin.options')}</h2>
                    <div className={styles.toogleSwitchSection}>
                        <div className={styles.toogleSwitchBlock}>
                            <span>{t('admin.videoRecording')}</span>
                            <div>
                                <ToggleSwitch
                                    // helperText={t('admin.ownerOnlyHelp')}
                                    inputTitle="the-title"
                                    label={t('admin.ownerOnlyStart')}
                                    labelPosition="right"
                                    showCheckedHint
                                />
                                <hr className={styles.hr} />
                                <ToggleSwitch
                                    inputTitle="the-title"
                                    label={t('admin.ownerOnlyDownload')}
                                    labelPosition="right"
                                    showCheckedHint
                                />
                            </div>
                        </div>
                        <div className={styles.toogleSwitchBlock}>
                            <span>{t('admin.roomOption')}</span>
                            <div>
                                <ToggleSwitch
                                    inputTitle="the-title"
                                    label={t('admin.switchLabel')}
                                    labelPosition="right"
                                    showCheckedHint
                                />
                                <hr className={styles.hr} />
                                <ToggleSwitch
                                    inputTitle="the-title"
                                    label="Label action interrupteur"
                                    labelPosition="right"
                                    showCheckedHint
                                />
                            </div>
                        </div>
                        <div className={styles.toogleSwitchBlock}>
                            <span>{t('admin.people')}</span>
                            <div>
                                <ToggleSwitch
                                    inputTitle="the-title"
                                    label={t('admin.allowVisitors')}
                                    labelPosition="right"
                                    showCheckedHint
                                />
                                <hr className={styles.hr} />
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
                                <hr className={styles.hr} />
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