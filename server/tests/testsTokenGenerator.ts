import jwt from "jsonwebtoken";

export const generateToken = (
	fullName: string,
	email: string,
	role: string,
	type: string,
) => {
	let role_converted: string;
	let payload = {};

	if (role.toLowerCase() === "student") {
		role_converted = "559e9aa0-84e4-49ac-b339-b41ae22740fa";
	} else if (role.toLowerCase() === "teacher") {
		role_converted = "10073ee5-6b85-4701-ada7-e6bad5c4718d";
	} else {
		role_converted = "0";
	}

	if (type === "invalid") {
		payload = {
			aud: null,
			iss: "https://login.microsoftonline.com/none/v2.0",
			iat: 0,
			nbf: 0,
			exp: 0,
			aio: null,
			email: email,
			groups: [role_converted],
			name: fullName,
			nonce: null,
			oid: null,
			preferred_username: email,
			rh: null,
			sid: null,
			sub: null,
			tid: null,
			uti: null,
			ver: null,
		};
	} else if (type === "valid") {
		payload = {
			aud: "6926162d-b563-44d6-a70f-2b6eaea6bb52",
			iss: "https://login.microsoftonline.com/9f9ce49a-5101-4aa3-8c75-0d5935ad6525/v2.0",
			iat: 1749311360,
			nbf: 1749311360,
			exp: 1749315260,
			aio: "AYQAe/8ZAAAAy1K3J2eGcxJlDuLXjDU5tLBlS8OtW8r+7r9iC0mVTFbvW6vpXX0aN8U+Aw8Ex7ZShafFjtncHI/+OPiElCkVAV+NPmr8GrIK7ox2XZp18Y1TZuh6hQBQ76C/jMUMMJwxoc7QN0vxOhAiafctYPxt81bZBUR6qtaPuVWfAIXoueQ=",
			email: email,
			groups: [role_converted],
			name: fullName,
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
	}

	const secret = "test_key";
	const token = jwt.sign(payload, secret);
	return `Bearer ${token}`;
};
