import css from './css';
export function keyframes(...args) {
    let insertable = css(...args);
    const name = `animation-${insertable.name}`;
    return {
        name,
        styles: `@keyframes ${name}{${insertable.styles}}`,
        anim: 1,
        toString() {
            return `_EMO_${this.name}_${this.styles}_EMO_`;
        }
    };
}
