import styles from './ChangelogContent.module.css'

import Button from '@apitechfr/react-dsapitech/Button';

function ChangelogContent({ content }: any) {
    console.log(content.blocks[0])

    return (
        <div className={styles.popupBoxContent}>
            <div className={styles.boxFrame}>
                <h1>{content.title}</h1>
                {content.blocks.map((block: any, blockIndex: number) => (
                    <div key={blockIndex}>
                        <p>{content.blocks[0].description}</p>
                        {block.features?.ameliorations?.length > 0 && (
                            <ul>
                                {block.features.ameliorations.map((data: string) => (
                                    <li key={data}>{data}</li>
                                ))}
                            </ul>
                        )}
                        <p>{content.version}</p>
                        <div className={styles.buttonsContainer}>
                            {block.link?.map((lien: any, key: number) => (
                                <div key={key}>
                                    {lien.href && (
                                        <div className={styles.frameContainerButton}>
                                            <Button
                                            className={styles.buttonMoreInfo}
                                            onClick={() => (window.location.href = lien.href)}
                                            >
                                                <span>{lien.label}</span>
                                            </Button>
                                        </div>
                                    )}

                                    {lien.link && (
                                        <div className={styles.frameContainerButton}>
                                            <Button className={styles.buttonMoreInfo}>
                                                <a href={lien.link} download>
                                                    {lien.label}
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

export default ChangelogContent;