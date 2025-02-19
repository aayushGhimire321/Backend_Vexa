export function localVariables(req, res, next) {
    // Check if email is provided in the request body
    const { email } = req.body;

    if (!email || email.trim() === "") {
        return res.status(422).send({ message: "Missing email." });
    }

    // Proceed with setting local variables
    res.app.locals = {
        OTP: null,
        resetSession: false,
        CODE: null,
        email: email // Store email in local variables if needed
    };

    next();
}
