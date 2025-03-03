exports.handler = async function(event, context) {
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ message: "CORS працює!" })
    };
};