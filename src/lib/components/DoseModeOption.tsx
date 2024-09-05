import { itemsByName } from '@lib/potions';
import { Checkbox } from '.';
import styles from './DoseModeOption.module.css';

const singleDoseSuperDefencePotions = itemsByName.get('super defence (1)')!;

interface DoseModeOptionProps {
  checked: boolean;
  onChange: (flag: boolean) => void;
}

export const DoseModeOption = (props: DoseModeOptionProps) => {
  return (
    <div className={styles.option}>
      <img src={singleDoseSuperDefencePotions.imageUrl} style={{objectFit: 'contain', maxWidth: '24px', maxHeight: '24px'}}/>
      <Checkbox
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
        data-tooltip-id="tooltip"
        data-tooltip-html={`${props.checked ? 'Disable' : 'Enable'} <span data-sepia>Dose mode</span><br />
Groups potions by type and shows the quantity to make in doses.<br /><br />
<span data-muted>Warning: Disabling this mode is computationally expensive. Enable this mode again if you experience stuttering.</span>`}
      />
    </div>
  )
}