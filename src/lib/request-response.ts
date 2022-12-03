export const respond = (
    res: any,
    req: any,
    statusCode: number,
    message?: string,
    data?: Record<string, any>,
) => {
    try {
        res.status(statusCode);
        res.json({
            success: statusCode < 400,
            message,
            data,
        });
    } catch (err) { }
};