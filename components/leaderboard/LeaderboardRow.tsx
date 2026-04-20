import { format } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";

type LeaderboardRowProps = {
  row: {
    rank: number;
    user_id: string;
    username: string;
    country: string | null;
    problems_solved: number;
    total_score: number;
    penalty_time: number;
    last_ac_time: string | null;
  };
  highlight: boolean;
};

function countryToFlag(countryCode: string | null) {
  if (!countryCode || countryCode.length !== 2) {
    return "--";
  }

  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export default function LeaderboardRow({ row, highlight }: LeaderboardRowProps) {
  return (
    <TableRow className={highlight ? "bg-accent/20" : ""}>
      <TableCell>{row.rank}</TableCell>
      <TableCell>{row.username}</TableCell>
      <TableCell>{countryToFlag(row.country)}</TableCell>
      <TableCell>{row.problems_solved}</TableCell>
      <TableCell>{row.total_score}</TableCell>
      <TableCell>{row.penalty_time}</TableCell>
      <TableCell>{row.last_ac_time ? format(new Date(row.last_ac_time), "PPp") : "-"}</TableCell>
    </TableRow>
  );
}
