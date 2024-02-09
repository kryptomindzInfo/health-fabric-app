const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

        const token = req.headers.authorization.split(' ')[1];
  console.log("welcome to JWT");
        if (token) {
            jwt.verify(token, 'jwt_Secret_Key_for_PHR_Of_32Bit_String', (err, decoded) => {
              if (err) {
                return res.status(401).json({
                  success: false,
                  message: 'Token is not valid'
                });
              } else {
                req.decoded = decoded;
                next();
              }
            });
          } else {
            return res.status(401).json({
              success: false,
              message: 'Auth token is not supplied'
            });
          }
};
