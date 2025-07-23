import { Input } from "@apitechfr/react-dsapitech/Input";
import { Breadcrumb } from "@apitechfr/react-dsapitech/Breadcrumb";
import { Tag } from "@apitechfr/react-dsapitech/Tag"

import styles from './Profile.module.css'
import { useState } from 'react';

function Profile () {

    const [isAdmin, setIsAdmin] = useState(true);

    return (
        <div className={styles.content}>
            <Breadcrumb
                currentPageLabel="Mon compte"
                homeLinkProps={{
                    href: '/'
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