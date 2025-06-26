import Input from '@codegouvfr/react-dsfr/Input';
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

import styles from './Profile.module.css'
import { useState } from 'react';

function Profile () {

    const [isAdmin, setIsAdmin] = useState(true);

    return (
        <div className={styles.content}>
            <Breadcrumb
                currentPageLabel="Mon compte"
                homeLinkProps={{
                    to: '/'
                }}
                segments={[]}
            />
            <div className={styles.titleBlock}>
                <h1>Mon compte</h1>
                {isAdmin && (
                    <div>
                        <Tag
                            dismissible
                            className={styles.adminTag}
                        >
                            Administrateur
                        </Tag>
                    </div>
                )}
            </div>
            <div className={styles.inputSection}>
                <Input
                    disabled
                    label='Nom'
                />

                <Input
                    disabled
                    label='Prénom'
                />

                <Input
                    disabled
                    label='Email'
                />
            </div>
        </div>
    )
}

export default Profile;