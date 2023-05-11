require('dotenv').config();

const app = require("../api");
const port = parseInt(process.env.PORT ?? '10800');

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});