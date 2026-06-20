const { ZodError } = require('zod')

const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }))
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        })
      }
      next(error)
    }
  }
}

module.exports = validate