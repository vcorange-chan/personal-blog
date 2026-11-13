const markdownWidget = window.CMS.getWidget("markdown");
const ImportableMarkdown = window.createClass({
	render() {
		return window.h("div", {}, [
			window.h("label", { key: "import", style: { display: "block", padding: "12px 0" } }, [
				"Import Markdown ",
				window.h("input", {
					key: "file",
					type: "file",
					accept: ".md,.markdown,text/markdown",
					onChange: async (event) => {
						const file = event.target.files[0];
						if (!file) return;
						if (file.size > 2_000_000) return window.alert("Maximum document size is 2 MB.");
						const text = await file.text();
						this.props.onChange(text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ""));
					},
				}),
			]),
			window.h(markdownWidget.control, { ...this.props, key: "editor" }),
		]);
	},
});
window.CMS.registerWidget("importable-markdown", ImportableMarkdown, markdownWidget.preview);
window.CMS.init();
