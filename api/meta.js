/**
 * @param req { import("@vercel/node").VercelRequest }
 * @param res { import("@vercel/node").VercelResponse }
 * */
module.exports = async (
    req,
    res,
  ) => {
    try {
      /** @type {Response} */
      const response = await fetch(`${process.env.hostedAPI ?? ''}${req.url}`)
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