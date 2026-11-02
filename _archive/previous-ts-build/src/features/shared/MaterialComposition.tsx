import { GradeChart, MetricTile, TileGrid } from "../../components/ui";
import { formatMT } from "../../lib/format";
import type { MaterialComposition as Composition } from "../../types/dashboard";
import styles from "./shared.module.css";

interface MaterialCompositionProps {
  composition: Composition;
  chartVariant?: "bars" | "columns";
  gradeSubtitle?: string;
}

/** ROM / Lumps / Fines summary tiles followed by the grade distribution charts. */
export function MaterialComposition({
  composition,
  chartVariant = "bars",
  gradeSubtitle = "Quantity and share within each material type",
}: MaterialCompositionProps) {
  const { rom, lumps, fines } = composition;

  return (
    <>
      <TileGrid>
        <MetricTile label="ROM" value={formatMT(rom)} caption="No grade applicable" />
        <MetricTile
          label="Lumps"
          value={formatMT(lumps.total)}
          caption={`${lumps.grades.length} grade bands`}
        />
        <MetricTile
          label="Fines"
          value={formatMT(fines.total)}
          caption={`${fines.grades.length} grade bands`}
        />
      </TileGrid>

      <div>
        <h3 className={styles.subheading}>Grade distribution</h3>
        <p className={styles.subtext}>{gradeSubtitle}</p>
        <div className={styles.chartGrid}>
          <GradeChart title="Lumps" total={lumps.total} grades={lumps.grades} variant={chartVariant} />
          <GradeChart title="Fines" total={fines.total} grades={fines.grades} variant={chartVariant} />
        </div>
      </div>
    </>
  );
}

