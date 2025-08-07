export const companyCleaner = (name: string) => {
	const suffixes = [
		// Finnish
		"oyj",
		"ab",
		"ky",
		"tmi",
		"oy",
		// English
		"inc",
		"llc",
		"corp",
		"co",
		"ltd",
		"lp",
		"llp",
		"corporation",
		"company",
		"limited",
		// common ones
		"holding",
		"holdings",
		"ltc",
		"group",
		"enterprises",
		"international",
		"intl",
		// Other European
		"gmbh",
		"ag",
		"sa",
		"srl",
		"bv",
		"spa",
		"sas",
		"sarl",
		"aps",
		"as",
		// More international
		"pvt",
		"pte",
		"bhd",
		"sdn",
		"tbk",
		"pt",
		"cv",
		"nv",
	];

	const toAscii = (str: string): string => {
		return str
			.normalize("NFD") // Decompose
			.replace(/[\u0300-\u036f]/g, "") // Remove diacritics
			.replace(/[^\x00-\x7F]/g, ""); // Keep only ASCII
	};

	const suffixPattern = new RegExp(`\\b(${suffixes.join("|")})\\b`, "gi");

	return toAscii(name)
		.toLowerCase()
		.replace(suffixPattern, "") // Remove suffixes
		.replace(/[^a-z0-9\s]/g, "") // Keep only alphanumeric and spaces
		.replace(/\s+/g, " ") // Normalize spaces
		.trim()
		.split(" ") // Split and rejoin to remove empty parts
		.filter((word) => word.length > 0)
		.join(" ");
};
