class ChangeEvent extends Event {
	public readonly property: string;

	constructor(property: string, direct = true) {
		super(direct ? "change" : "passedchange");
		this.property = property;
	}
}

export type ChangeListener = (event: ChangeEvent) => any;

class ChangeNotifier extends EventTarget {
	protected notify(...properties: string[]) {
		for(let property of properties) this.dispatchEvent(new ChangeEvent(property));
	}

	private passedNotify(property: string) {
		this.dispatchEvent(new ChangeEvent(property, false));
	}

	protected pass(notifier: ChangeNotifier) {
		notifier.addListener(evt => this.passedNotify(evt.property));
	}

	protected passAll(notifiers: ChangeNotifier[]) {
		notifiers.forEach(n => this.pass(n));
	}

	public addListener(listener: ChangeListener, passedNotifies = true) {
		this.removeEventListener("change", listener);
		this.removeEventListener("passedchange", listener);
		this.addEventListener("change", listener);
		if(passedNotifies) this.addEventListener("passedchange", listener);
	}
}

export default ChangeNotifier;