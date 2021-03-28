export type ChangeListener = (property: string, direct: boolean) => any;

class ChangeNotifier {
	private listenerList: {callback: ChangeListener, passed: boolean}[] = [];

	protected notify(...properties: string[]) {
		for(let property of properties) {
			for(let {callback} of this.listenerList) callback?.(property, true);
		}
	}

	private passedNotify(property: string) {
		for(let {callback, passed} of this.listenerList) if(passed) callback(property, false);
	}

	protected pass(notifier: ChangeNotifier) {
		notifier.addListener((property) => this.passedNotify(property));
	}

	protected passAll(notifiers: ChangeNotifier[]) {
		notifiers.forEach(n => this.pass(n));
	}

	public removeListener(listener: ChangeListener) {
		const index = this.listenerList.findIndex(({callback}) => callback === listener);
		if(index !== -1) this.listenerList.splice(index, 1);
	} 

	public addListener(listener: ChangeListener, passedNotifies = false) {
		this.listenerList.push({callback: listener, passed: passedNotifies});
	}
}

export default ChangeNotifier;