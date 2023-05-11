import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';

esbuild.build({
    entryPoints: ["src/App.jsx"],
    outdir: "public",
    bundle: true,
    metafile: true,
    plugins: [
        sassPlugin({
            async transform(source) {
                const { css } = await postcss([autoprefixer]).process(source, { from: undefined });
                return css;
            },
        }),
    ],
    loader: {
      ".woff": "file",
      ".woff2": "file",
    },
}).catch(() => process.exit(1));