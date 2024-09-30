export default function extractMentions(inputString: string): string {
    if (!inputString) return "";

    // Regular expression to match the pattern <@&number> or <@number>
    const regex = /<@(&)?(\d+)>/g;

    // Find all matches in the input string
    const matches = [...inputString.matchAll(regex)];

    // Return only valid mentions in the format <@number> or <@&number>
    return matches
        .map((match) => `<@${match[1] ? "&" : ""}${match[2]}>`)
        .join(" ");
}
