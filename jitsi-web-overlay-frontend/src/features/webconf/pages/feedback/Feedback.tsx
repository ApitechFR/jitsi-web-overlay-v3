import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Feedback.module.css';
import { Button } from '@apitechfr/react-dsapitech/Button';
import { Input } from '@apitechfr/react-dsapitech/Input';
import { Badge } from '@apitechfr/react-dsapitech/Badge';
import Rating from '@mui/material/Rating';
import StarIcon from '@mui/icons-material/Star';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import api from '../../../../axios/axios';
import { useNavigate } from 'react-router-dom';


type errorObj = {
    message: string;
    error: {
        status: string;
        stack: string;
    };
};

interface feedbackProps {
    setError: (e: errorObj) => void;
}

export default function Feedback({ setError }: feedbackProps) {
    const { t } = useTranslation();
    const [qty, setQty] = useState(0);
    const [inv, setInv] = useState(0);
    const [text, setText] = useState('');
    const [fromRIE, setFromRIE] = useState(false);
    const [deskConnexion, setDeskConnexion] = useState(-1);
    const [msg, setMsg] = useState({ message: '', error: {} });
    const [msginfo, setMsginfo] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api
            .get('/authentication/whereami')
            .then(res => {
                if (res.data.toLowerCase() !== 'internet') {
                    setFromRIE(true);
                }
            })
            .catch(error => {
                if (error.response) {
                    setMsg({
                        message: t('feedback.errorDetectOrigin'),
                        error: { status: '', stack: '' },
                    });
                } else {
                    if (error.request) {
                        setError({
                            message: t('feedback.errorDetectOrigin'),
                            error: { status: '', stack: '' },
                        });
                        navigate('/error');
                    } else {
                        setError({
                            message: t('feedback.errorDetectOrigin'),
                            error: { status: '', stack: '' },
                        });
                        navigate('/error');
                    }
                }
            });
    });

    useEffect(() => {
        if (qty !== 0) {
            if (qty <= 3) {
                setMsginfo(true);
                return;
            } else {
                setMsginfo(false);
                return;
            }
        }
    });

    const sendFeedback = () => {
        if (qty < 1) {
            setMsg({ message: t('feedback.qualityRequired'), error: {} });
            return;
        }
        const jmmc_objectId = sessionStorage.getItem('jmmc_object_id');
        api
            .post('feedback', {
                rt: { qty: qty, inv: inv },
                isVPN: deskConnexion,
                com: text,
                jmmc_objectId: jmmc_objectId,
            })
            .then(res => {
                if (res.data.error) {
                    setMsg(res.data);
                } else {
                    setMsg(res.data);
                    return navigate('/');
                }
            })
            .catch(() => {
                setMsg({
                    message: t('feedback.sendError'),
                    error: {},
                });
            });
    };

    return (
        <div className={styles.home}>
            <h1>{t('feedback.title')}</h1>
            <div className={styles.form}>
                <div className={styles.formItem}>
                    <h4>{t('feedback.serviceQuality')}</h4>
                    <label className={styles.label}>
                        {t('feedback.qualityLabel')}
                    </label>
                    <Rating
                        emptyIcon={
                            <StarIcon
                                style={{ opacity: 0.51, color: '#0a76f6' }}
                                fontSize="inherit"
                            />
                        }
                        size="large"
                        className={styles.rating}
                        name="simple-controlled"
                        value={qty}
                        onChange={(event, newValue) => {
                            setQty(Number(newValue));
                        }}
                    />
                </div>

                <div className={styles.formItem}>
                    <label>
                        {t('feedback.invitationLabel')}
                    </label>
                    <Rating
                        emptyIcon={
                            <StarIcon
                                style={{ opacity: 0.51, color: '#0a76f6' }}
                                fontSize="inherit"
                            />
                        }
                        size="large"
                        className={styles.rating}
                        name="simple-controlled"
                        value={inv}
                        onChange={(event, newValue) => {
                            setInv(Number(newValue));
                        }}
                    />
                </div>
                {fromRIE ? (
                    <div className={styles.formItem}>
                        <label className={styles.label}>
                            {t('feedback.officeConnection')}
                        </label>
                        <div className={styles.radio}>
                            <RadioGroup
                                row
                                aria-labelledby="demo-row-radio-buttons-group-label"
                                name="row-radio-buttons-group"
                                value={deskConnexion}
                                onChange={e => {
                                    setDeskConnexion(Number(e.target.value));
                                }}
                            >
                                <FormControlLabel value={1} control={<Radio />} label={t('feedback.yes')} />
                                <FormControlLabel value={0} control={<Radio />} label={t('feedback.no')} />
                            </RadioGroup>
                        </div>
                    </div>
                ) : null}
                <div className={styles.formItem}>
                    <Input
                        nativeTextAreaProps={{
                            name: 'comment_textarea',
                            id: 'comment_textarea',
                            autoFocus: true,
                            value: text,
                            onChange: e => setText(e.target.value),
                        }}
                        className={styles.textInput}
                        textArea
                        label={t('feedback.commentLabel')}
                    ></Input>
                    {msg.message ? (
                        <Badge
                            className={styles.badge}
                            small
                            severity={msg.error ? 'error' : 'success'}
                        >
                            {msg.message}
                        </Badge>
                    ) : null}
                    {msginfo ? (
                        <Badge className={styles.badge} small severity={'info'}>
                            <p>
                                {t('feedback.difficulties')}{' '}
                                <a href="/static/contact">
                                    {t('feedback.askSupport')}
                                </a>
                            </p>
                        </Badge>
                    ) : null}
                    <Button
                        type="submit"
                        nativeButtonProps={{
                            id: 'submitBTN',
                        }}
                        onClick={sendFeedback}
                    >
                        {t('feedback.send')}
                    </Button>
                    <div id="feedback_server_response"></div>
                </div>
            </div>
        </div>
    );
}
