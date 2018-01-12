/*jslint node:true*/
/*jslint nomen:true*/
/*jslint esversion:6*/
'use strict';

module.exports = function (Customuser) {

    var DataSource = require('loopback-datasource-juggler').DataSource;

    var ds = new DataSource({
        host: "10.41.55.4",
        port: 5432,
        url: "postgres://postgres:P@ssw0rd@10.41.55.4/DBPMS",
        database: "DBPMS",
        password: "P@ssw0rd",
        name: "PMSServer",
        user: "postgres",
        connector: "postgresql"
    });

	/** This call adds custom behaviour to the standard Loopback login.
	 *
	 *  Since it uses the User.login function of the User model, let's also
	 *  keep the same parameter structure.
	 */
    Customuser.addToLogin = function (credentials, include, callback) {

        console.log(credentials);
        console.log(credentials.username);

        // Invoke the default login function
        var findData = `select * from users Where username = '${credentials.username}' AND password = '${credentials.password}'`;
         ds.connector.query(findData, function (err, brands) {
            if (err) return callback(err);
          console.log(credentials);
          return Customuser.login(credentials, include, function (loginErr, loginToken) {
                if (loginErr)
                    return callback(loginErr);

                /* If we got to this point, the login call was successfull and we
                 * have now access to the token generated by the login function.
                 *
                 * This means that now we can add extra logic and manipulate the
                 * token before returning it. Unfortunately, the login function
                 * does not return the user data, so if we need it we need to hit
                 * the datasource again to retrieve it.
                 */

                // If needed, here we can use loginToken.userId to retrieve
                // the user from the datasource
                return Customuser.findById(loginToken.userId, function (findErr, userData) {
                    if (findErr)
                        return callback(findErr);

                    console.log(userData);

                    // Here you can do something with the user info, or the token, or both

                    // Return the access token
                    return callback(null, loginToken.toObject());
                });
            });
        });
    };

	/** Register a path for the new login function
	 */
    Customuser.remoteMethod('addToLogin', {
        http: {
            path: '/add_to_login',
            verb: 'post'
        },
        accepts: [
            {
                arg: 'credentials',
                type: 'object',
                description: 'Login credentials',
                required: true,
                http: {
                    source: 'body'
                }
            },
            {
                arg: 'include',
                type: 'string',
                description: 'Related objects to include in the response. See the description of return value for more details.',
                http: {
                    source: 'query'
                }
            }
        ],
        returns: [
            {
                arg: 'token',
                type: 'object',
                root: true
            }
        ]
    });
};