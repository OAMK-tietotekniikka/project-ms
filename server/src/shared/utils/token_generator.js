const jwt = require("jsonwebtoken");
const readline = require("readline");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

console.log("Example: Student One s1@mail.com student");
rl.question("Enter first name, last name, and email, and role: ", (input) => {
	const [first_name, last_name, email, role] = input.trim().split(/\s+/);
	const user_name = first_name + " " + last_name;
	const role_converted =
		role === "student"
			? "559e9aa0-84e4-49ac-b339-b41ae22740fa"
			: "10073ee5-6b85-4701-ada7-e6bad5c4718d";

	const payload = {
		aud: "6926162d-b563-44d6-a70f-2b6eaea6bb52",
		iss: "https://login.microsoftonline.com/9f9ce49a-5101-4aa3-8c75-0d5935ad6525/v2.0",
		iat: 1749311360,
		nbf: 1749311360,
		exp: 1749315260,
		aio: "AYQAe/8ZAAAAy1K3J2eGcxJlDuLXjDU5tLBlS8OtW8r+7r9iC0mVTFbvW6vpXX0aN8U+Aw8Ex7ZShafFjtncHI/+OPiElCkVAV+NPmr8GrIK7ox2XZp18Y1TZuh6hQBQ76C/jMUMMJwxoc7QN0vxOhAiafctYPxt81bZBUR6qtaPuVWfAIXoueQ=",
		email: email,
		groups: [role_converted],
		name: user_name,
		nonce: "01974b19-98f3-7abc-8836-08938dbbac13",
		oid: "dde7b629-a8fb-4d77-aa6b-c419d852b154",
		preferred_username: email,
		rh: "1.ASEAmuScnwFRo0qMdQ1ZNa1lJS0WJmljtdZEpw8rbq6mu1KGANkhAA.",
		sid: "005c0a99-4e3a-e116-52a0-a4db990d8d54",
		sub: "jdWVgDuun0z_6Q6IXFFSRPS7AtcquAEAMdBLYFDQf-g",
		tid: "9f9ce49a-5101-4aa3-8c75-0d5935ad6525",
		uti: "6tyxfOQP3UK4mfTwTysGAQ",
		ver: "2.0",
	};
	const secret = "your-secret-key";

	const token = jwt.sign(payload, secret);
	console.log(token);

	rl.close();
});
