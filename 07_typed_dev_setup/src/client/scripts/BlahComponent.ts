class BlahComponent {
  private element: HTMLElement;

  constructor(private selector: string) {
    this.element = <HTMLElement>document.querySelector(selector);
  }

  setText(text: string) {
    this.element.textContent = text;
  }
}

export = BlahComponent