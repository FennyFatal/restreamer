const { decode } = require('jsonwebtoken')
let authtoken

const refreshAuthtoken = async () => {
  if (authtoken && decode(authtoken).exp > (new Date().getTime() / 1000))
    return authtoken
  console.log('Refreshing token')
  const { refreshToken } = await (await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBOOpV21k6o3cJc56-4uRNb0jDMzIxShMY", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
    },
    "referrerPolicy": "no-referrer",
    "body": `{\"returnSecureToken\":true,\"email\":\"${process.env.email}\",\"password\":\"${process.env.password}\"}`,
    "method": "POST"
  })).json();
  let { access_token } = await (await fetch("https://securetoken.googleapis.com/v1/token?key=AIzaSyBOOpV21k6o3cJc56-4uRNb0jDMzIxShMY", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/x-www-form-urlencoded",
    },
    "body": `grant_type=refresh_token&refresh_token=${refreshToken}`,
    "method": "POST"
  })).json();
  return authtoken = access_token
}

const getToken = async (_,res) => {
    await refreshAuthtoken();
    res.send(authtoken);
}
getToken.refreshAuthtoken = refreshAuthtoken

module.exports = getToken