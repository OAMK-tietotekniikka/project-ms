const fs = require("fs");
const path = require("path");

const rootPackage = JSON.parse(fs.readFileSync("../package.json", "utf-8"));
const version = rootPackage.version;
console.log(`Updating versions to ${version}`);

const packages = ["../frontend", "../server"];

for (const pkg of packages) {
	const pkgPath = path.join(pkg, "package.json");
	const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

	pkgJson.version = version;

	fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + "\n");
	console.log(`Updated ${pkg}/package.json to version ${version}`);
}
