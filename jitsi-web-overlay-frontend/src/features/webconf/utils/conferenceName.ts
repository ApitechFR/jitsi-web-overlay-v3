// Placeholder for validateconferenceName function. Please move the actual implementation here if needed.
export function validateconferenceName(name: string): boolean {
    // Example validation: at least 10 chars, at least 3 digits, alphanumeric
    const regex = /^(?=(?:[a-zA-Z0-9]*[a-zA-Z]))(?=(?:[a-zA-Z0-9]*[0-9]){3})[a-zA-Z0-9]{10,}$/;
    return regex.test(name);
}
