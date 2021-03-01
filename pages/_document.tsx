import React from "react";
import Document, { DocumentContext, DocumentInitialProps, Head, Html, Main, NextScript } from "next/document";
import { ServerStyleSheets } from "@material-ui/core";

class MyDocument extends Document {
	render() {
		return (
			<React.StrictMode>
				<Html lang="en">
					<Head />
					<body>
						<Main />
						<NextScript />
					</body>
				</Html>
			</React.StrictMode>
		);
	}

	static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
		const sheets = new ServerStyleSheets();
		const originalRenderPage = ctx.renderPage;

		ctx.renderPage = () => originalRenderPage({
			enhanceApp: (App) => (props) => sheets.collect(<App {...props} />)
		});

		const initialProps = await Document.getInitialProps(ctx);

		return {
			...initialProps,
			styles: [...React.Children.toArray(initialProps.styles), sheets.getStyleElement()]
		}
	}
}

export default MyDocument;