import React, { useEffect, useRef } from 'react';

/**
 * SSO Hybrid POST + JSON (Solution 3) - React Component
 * 
 * Secure SSO flow from Application A to Application B:
 * - Generates a nonce (anti-replay token)
 * - Submits token + nonce in POST body (not URL)
 * - Automatically submits hidden form to backend
 * - Backend validates and sets session cookies
 * - Redirects to /room/{room} or home
 * 
 * Usage:
 * <SsoLoginForm 
 *   token={jwtTokenFromAppA} 
 *   room="optional-conference-name"
 *   onError={(error) => console.error(error)}
 * />
 * 
 * Or with button:
 * const { generateForm, submit } = useSsoLogin();
 * <button onClick={() => submit(token, room)}>Login</button>
 */

interface SsoLoginFormProps {
    /**
     * JWT RS256 token from Provider/Application A
     * This should be obtained from Application A before redirecting to Application B
     */
    token: string;

    /**
     * Optional conference name to redirect to after login
     * If not provided, redirects to home
     */
    room?: string;

    /**
     * Error callback - called if form submission fails
     */
    onError?: (error: Error) => void;

    /**
     * Success callback - called before redirect
     */
    onSuccess?: (result: any) => void;

    /**
     * Backend endpoint (default: /authentication/sso-login)
     * Override if using different base URL
     */
    endpoint?: string;

    /**
     * Auto-submit on mount (default: true)
     * Set to false to submit manually via ref
     */
    autoSubmit?: boolean;

    /**
     * Display form while submitting (default: false)
     * Set to true to show form instead of loading state
     */
    showForm?: boolean;
}

/**
 * Main SsoLoginForm Component
 * 
 * Usage example:
 * ```tsx
 * <SsoLoginForm 
 *   token={jwtToken}
 *   room="meeting-001"
 * />
 * ```
 */
export const SsoLoginForm: React.FC<SsoLoginFormProps> = ({
    token,
    room,
    onError,
    onSuccess,
    endpoint = '/authentication/sso-login',
    autoSubmit = true,
    showForm = false,
}) => {
    const formRef = useRef<HTMLFormElement>(null);
    const nonceRef = useRef<string>('');

    // Generate nonce on component mount
    useEffect(() => {
        nonceRef.current = generateNonce(32);
    }, []);

    // Auto-submit form on mount
    useEffect(() => {
        if (autoSubmit && formRef.current) {
            submitForm();
        }
    }, [autoSubmit]);

    /**
     * Generate random nonce for anti-replay protection
     * Format: alphanumeric string (32 chars = 192 bits of entropy)
     */
    const generateNonce = (length: number = 32): string => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let nonce = '';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            nonce += charset[array[i] % charset.length];
        }
        return nonce;
    };

    /**
     * Submit form to backend via POST
     */
    const submitForm = async () => {
        if (!formRef.current) {
            const error = new Error('Form reference not found');
            onError?.(error);
            return;
        }

        try {
            // Option 1: Traditional form submit (CSRF-resistant, HAS language features)
            // This is more secure for browser POST because of CSRF implicit validation
            formRef.current.submit();

            // Option 2: Fetch API submit (alternative, requires manual handling)
            // await submitViaFetch();
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
        }
    };

    /**
     * Alternative: Submit via Fetch API
     * Less preferred than form submit due to CSRF considerations
     */
    const submitViaFetch = async (): Promise<void> => {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for cross-domain
                body: JSON.stringify({
                    token,
                    nonce: nonceRef.current,
                    room,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            onSuccess?.(result);

            // Redirect to target
            if (result.redirectTarget) {
                window.location.href = result.redirectTarget;
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
        }
    };

    if (showForm) {
        return (
            <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <h3>Logging in...</h3>
                <p>Please wait while we authenticate you.</p>
                {/* Form visible for debugging */}
                {renderForm()}
            </div>
        );
    }

    return (
        <>
            {/* Hidden form for traditional POST submit */}
            {renderForm()}

            {/* Optional loading message */}
            <div style={{ fontSize: '14px', color: '#666' }}>
                Redirecting...
            </div>
        </>
    );

    /**
     * Render hidden form with token, nonce, room
     */
    function renderForm() {
        return (
            <form
                ref={formRef}
                method="POST"
                action={endpoint}
                style={{ display: 'none' }}
            >
                {/* Token (required) */}
                <input
                    type="hidden"
                    name="token"
                    value={token}
                    required
                />

                {/* Nonce (required for anti-replay) */}
                <input
                    type="hidden"
                    name="nonce"
                    value={nonceRef.current}
                    required
                />

                {/* Room (optional) */}
                {room && (
                    <input
                        type="hidden"
                        name="room"
                        value={room}
                    />
                )}

                {/* Submit button (hidden, triggered via JS) */}
                <button type="submit" style={{ display: 'none' }} />
            </form>
        );
    }
};

/**
 * Custom hook for manual SSO login control
 * 
 * Usage:
 * ```tsx
 * const { generateForm, submit } = useSsoLogin();
 * 
 * <button onClick={() => submit(token, room)}>
 *   Login
 * </button>
 * ```
 */
export const useSsoLogin = (endpoint: string = '/authentication/sso-login') => {
    /**
     * Generate nonce for anti-replay
     */
    const generateNonce = (length: number = 32): string => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let nonce = '';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            nonce += charset[array[i] % charset.length];
        }
        return nonce;
    };

    /**
     * Generate hidden form and submit
     */
    const generateAndSubmitForm = (token: string, room?: string): void => {
        const nonce = generateNonce(32);

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = endpoint;
        form.style.display = 'none';

        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = token;
        form.appendChild(tokenInput);

        const nonceInput = document.createElement('input');
        nonceInput.type = 'hidden';
        nonceInput.name = 'nonce';
        nonceInput.value = nonce;
        form.appendChild(nonceInput);

        if (room) {
            const roomInput = document.createElement('input');
            roomInput.type = 'hidden';
            roomInput.name = 'room';
            roomInput.value = room;
            form.appendChild(roomInput);
        }

        document.body.appendChild(form);
        form.submit();
    };

    /**
     * Submit via fetch API (alternative to form submit)
     */
    const submitViaFetch = async (
        token: string,
        room?: string,
    ): Promise<any> => {
        const nonce = generateNonce(32);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                token,
                nonce,
                room,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Redirect if server provided target
        if (result.redirectTarget) {
            window.location.href = result.redirectTarget;
        }

        return result;
    };

    return {
        /**
         * Generate nonce
         */
        generateNonce,

        /**
         * Submit via hidden form (CSRF-resistant, HAS features)
         */
        submit: generateAndSubmitForm,

        /**
         * Submit via fetch API (alternative)
         */
        submitFetch: submitViaFetch,
    };
};

/**
 * Button component for SSO login
 * 
 * Usage:
 * ```tsx
 * <SsoLoginButton 
 *   token={jwtToken}
 *   room="meeting-001"
 *   className="btn-primary"
 * >
 *   Login via SSO
 * </SsoLoginButton>
 * ```
 */
export const SsoLoginButton: React.FC<{
    token: string;
    room?: string;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onError?: (error: Error) => void;
}> = ({
    token,
    room,
    children = 'Login',
    className,
    style,
    onError,
}) => {
        const { submit } = useSsoLogin();

        const handleClick = () => {
            try {
                submit(token, room);
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                onError?.(err);
            }
        };

        return (
            <button
                onClick={handleClick}
                className={className}
                style={style}
            >
                {children}
            </button>
        );
    };

export default SsoLoginForm;
