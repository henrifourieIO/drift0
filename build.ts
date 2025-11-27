// Build script using esbuild via npm
const isProduction = Deno.args.includes("--production") || Deno.args.includes("-p");

async function build() {
  console.log(`Building React app (${isProduction ? "production" : "development"})...`);

  try {
    const args = [
      "-y",
      "esbuild",
      "./app.tsx",
      "--bundle",
      "--format=esm",
      "--jsx=automatic",
      "--jsx-import-source=react",
      "--outfile=./static/app.js",
      "--external:react",
      "--external:react-dom/client",
    ];

    // Add production optimizations
    if (isProduction) {
      args.push(
        "--minify",
        "--tree-shaking=true",
        "--drop:console",
        "--drop:debugger",
        "--define:process.env.NODE_ENV=\"production\""
      );
    }

    const command = new Deno.Command("npx", { args });
    const { code, stdout, stderr } = await command.output();

    if (code !== 0) {
      const error = new TextDecoder().decode(stderr);
      throw new Error(`Build failed: ${error}`);
    }

    console.log("✓ Build complete: static/app.js");
    
    if (isProduction) {
      // Show bundle size
      const stat = await Deno.stat("./static/app.js");
      const sizeKb = (stat.size / 1024).toFixed(1);
      console.log(`  Bundle size: ${sizeKb} KB`);
    }

    const output = new TextDecoder().decode(stdout);
    if (output) console.log(output);
  } catch (error) {
    console.error("Build failed:", error);
    console.error("Make sure npm/npx is available, or install esbuild manually");
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await build();
}

