/**
 * @param req { import("@vercel/node").VercelRequest }
 * @param res { import("@vercel/node").VercelResponse }
 * */
module.exports = async (
        req,
        res,
      ) => {
        const params = req.url.replace(/\/api\/parts\//, '');
        try {
          /** @type {Response} */
          const response = await fetch(`https://customer-jwh6wms36w6479b4.cloudflarestream.com/${params}`)
          response.body.pipeTo(
            new WritableStream({
              write(chunk) {
                res.write(chunk);
              },
              close() {
                res.end();
              },
            })
          );
        } catch (e) {
          console.log(e)
          res.send(null);
        }
      }