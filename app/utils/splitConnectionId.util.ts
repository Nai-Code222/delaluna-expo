// app/utils/splitConnectionId.util.ts
export default function splitConnectionId(id: string) {
  if (!id) return { first: "", second: "" };

  // Split the connection ID into two halves: before and after the dash
  const [firstRaw, secondRaw] = id.split("-");

  const formatName = (raw: string) => {
    if (!raw) return "";
    // Split by underscore and capitalize each part
    return raw
      .split("_")
      .filter(Boolean)
      .map(
        (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      )
      .join(" ");
  };

  return {
    first: formatName(firstRaw),  // e.g. "Jeanai Roberts"
    second: formatName(secondRaw) // e.g. "Ferdie Smith"
  };
}
