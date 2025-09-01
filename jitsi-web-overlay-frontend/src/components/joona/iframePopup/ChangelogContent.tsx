import styles from './ChangelogContent.module.css'

import Button from '@apitechfr/react-dsapitech/Button';

function ChangelogContent({ content }: any) {
    console.log(content.blocks[0])

    return (
        <div className={styles.popupBoxContent}>
            <div className={styles.boxFrame}>
                <h1>{content.title}</h1>
                <p>{content.blocks[0].description}</p>
                <ul>
                    {content.blocks[0].features.ameliorations.map((data: string) => (
                        <li key={data}>{data}</li>
                    ))}
                </ul>
                <p>{content.version}</p>
                {content.blocks[0].link.href && (
                    <div className={styles.frameContainerButton}>
                        <Button
                            className={styles.buttonMoreInfo}
                            onClick={() => window.location.href = content.blocks[0].link.href}
                        >
                            <span>{content.blocks[0].link.label}</span>
                        </Button>
                    </div>
                )}
                {content.blocks.map((block: any, blockIndex: number) => (
                    block.link[1]?.link && (
                        <div className={styles.frameContainerButtonUpload} key={blockIndex}>
                        <Button
                            className={styles.buttonMoreInfo}
                        >
                            <a href={block.link[1].link} download>{block.link[1].label}</a>
                        </Button>
                        </div>
                    )
                ))}
            </div>
        </div>
    )
};

export default ChangelogContent;