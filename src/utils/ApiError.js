class ApiError extends Error {
    constructor(
        statusCode, 
        message="SOMETHING WENT WRONG",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false 
        this.errors = errors

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

// here we are implementing errors we will send to an user if they encounter. Here we are extending the ERROR class and 
// overwrite some of its value using a constructor. 
export { ApiError }

// similarly we can handle our responses aswell
