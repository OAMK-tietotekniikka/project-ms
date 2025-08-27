import { danger, fail, warn, message } from "danger";

const pr = danger.github.pr;
const modified = danger.git.modified_files;
const bodyAndTitle = (pr.body + pr.title).toLowerCase();

if (pr.additions + pr.deletions > 1000) {
	warn("This PR is quite large. Consider breaking it into smaller PRs.");
}

const packageJsonFiles = [
	"package.json", // root
	"server/package.json", // server
	"frontend/package.json", // frontend
];
const modifiedPackageJsons = packageJsonFiles.filter((file) =>
	modified.includes(file),
);
const lockfileModified = modified.includes("pnpm-lock.yaml");

modifiedPackageJsons.forEach((file) => {
	danger.git.JSONDiffForFile(file).then((diff) => {
		if (!diff) return;
		const depSections = [
			"dependencies",
			"devDependencies",
			"peerDependencies",
			"optionalDependencies",
		];

		const hasDepChanges = depSections.some(
			(section) => diff[section] && Object.keys(diff[section]).length > 0,
		);
		if (hasDepChanges) {
			if (!lockfileModified) {
				warn(
					`Dependencies were updated in \`${file}\` but \`pnpm-lock.yaml\` was not updated. Please run \`pnpm install\`.`,
				);
			} else {
				message(
					`Dependencies updated in \`${file}\` and lockfile was updated.`,
				);
			}
		}
	});
});
