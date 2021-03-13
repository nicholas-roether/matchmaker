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

	public addListener(listener: ChangeListener, passedNotifies = false) {
		this.removeEventListener("change", e => listener(e as ChangeEvent));
		this.removeEventListener("passedchange", e => listener(e as ChangeEvent));
		this.addEventListener("change", e => listener(e as ChangeEvent));
		if(passedNotifies) this.addEventListener("passedchange", e => listener(e as ChangeEvent));
	}
}

export {
	ChangeEvent
}

export default ChangeNotifier;