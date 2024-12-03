Tab Protector is a browser extension designed for preventing accidental closure or refreshing of specific sites. Ideal for users who often fill out lengthy forms or engage in workflows that must not be disrupted, this extension offers a straightforward solution to avoid losing work. Once configured, protection is automatically enforced whenever you revisit a listed URL.

How to choose a URL:
- Entering a URL will apply the protection to any URLs that start with what you submitted.
- For example, protecting "example.com" will also cover "example.com/path", but protecting "example.com/path" won't also cover "example.com".
- The same is true for subdomains. If you set "example.com" as protected, that won't cover "sub.example.com" or "sub.example.com/path" because they don't start with "example.com", and vice versa.

IMPORTANT:
- Due to Chrome's restrictions, this will only work for pages once you've somehow interacted with the page at any point after loading it, like by clicking anywhere inside the viewport once.
- For example, if you open a site you set as protected and then immediately try to close it without using the site at all, it will close without prompting you. Although, if you are using this for a site, then it is probably to keep work (interactions) from getting deleted on refresh/close, so you likely won't need to think about this.

Key Features:
- Tab Close/Refresh Protection:
    Once activated for a particular URL, the extension prevents the tab from being refreshed or closed accidentally, no matter how the refresh/close is initiated. Users attempting to close a protected tab will see a popup asking if they truly want to close the tab. A notification will also show on the page briefly to remind them why that is showing.
- Extra Refresh Prevention:
    Blocks unintended page reloads caused by pressing keys like F5 or Ctrl+R without showing the prompt. Due to how Chrome is set up, this extra protection is only possible for refreshing shortcuts while the website itself is in focus, and it is not possible for built-in shortcuts that would close the tab.
- Customizable URL List:
    Add or remove URLs from the protection list via the popup interface, which you can get to by clicking on the extension's icon.
- Current Tab Support:
    Quickly protect the currently open URL with a single click.

Data Storage:
- Tab Protector stores its settings, including the list of protected URLs, using Chrome's sync storage. This allows your preferences to stay consistent across devices when logged into the same Chrome account.


For feature requests or bug reports, feel free to send me an email: contact@stefior.com
