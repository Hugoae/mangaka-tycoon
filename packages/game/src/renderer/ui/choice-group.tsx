export interface Choice {
  readonly id: string;
  readonly label: string;
}

export interface ChoiceGroupProps {
  readonly legend: string;
  /** Radio buttons of the same group share a name. */
  readonly name: string;
  readonly choices: readonly Choice[];
  readonly value: string;
  readonly onChange: (id: string) => void;
}

/** A labelled group of mutually exclusive choices, styled as buttons. */
export function ChoiceGroup(props: ChoiceGroupProps) {
  return (
    <fieldset className="choices">
      <legend className="choices__legend">{props.legend}</legend>
      <div className="choices__list">
        {props.choices.map((choice) => (
          <label className="choices__item" key={choice.id}>
            <input
              className="choices__input"
              type="radio"
              name={props.name}
              value={choice.id}
              checked={choice.id === props.value}
              onChange={() => {
                props.onChange(choice.id);
              }}
            />
            <span className="choices__label">{choice.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
