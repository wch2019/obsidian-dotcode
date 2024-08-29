import {
	addIcon,
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	parseYaml,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile
} from 'obsidian';
import './styles.css';


// 插件的默认设置
interface DotCodeArticleSettings {
	publishUrl: string;
	fileUrl: string;
	username: string;
	password: string;
	sessionToken: string;
	userInfo: {
		avatar: string;
		username: string;
		articleCount: string;
		tagsCount: string;
		categoryCount: string;
	};
	checkArticle: any;
	showArticle: boolean;
}

const DEFAULT_SETTINGS: DotCodeArticleSettings = {
	// api地址
	publishUrl: 'http://192.168.31.7:8089/api/',
	fileUrl: 'document/upload/',
	// 用户名
	username: '',
	// 密码
	password: '',
	// token
	sessionToken: '',
	// 用户信息
	userInfo: {
		avatar: '',
		username: '',
		articleCount: '',
		tagsCount: '',
		categoryCount: ''
	},
	checkArticle: {
		id: '',
		title: '',
		createdTime: '',
		updatedTime: '',
		isPush: 0,
	},
	showArticle: false
}

export default class DotCodeArticle extends Plugin {
	settings: DotCodeArticleSettings;

	async onload() {
		// 加载设置
		await this.loadSettings();

		addIcon("dotcodeIcon", `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100px" height="100px" viewBox="0 0 100 100" version="1.1"><g id="surface1"><path style=" stroke:none;fill-rule:nonzero;fill:rgb(87,96,106);fill-opacity:1;" d="M 47.789062 0 C 57.515625 -1.785156 68.773438 1.839844 76.992188 7.078125 C 88.449219 15.226562 96.84375 25.457031 99.683594 39.53125 C 101.28125 49.894531 100.492188 60.210938 96.460938 69.910156 C 96.011719 71.0625 96.011719 71.0625 95.550781 72.238281 C 89.710938 85.515625 78.214844 93 65.246094 98.277344 C 52.992188 102.527344 38.992188 100.542969 27.472656 95.261719 C 15.035156 88.914062 6.5 78.632812 1.769531 65.488281 C -1.867188 53.164062 -1.375 39.25 4.761719 27.8125 C 5.765625 26.171875 6.855469 24.582031 7.964844 23.007812 C 9.425781 23.300781 10.886719 23.59375 12.390625 23.894531 C 13.640625 27.941406 12.796875 30.234375 11.171875 34.070312 C 6.382812 45.527344 6.964844 56.59375 11.503906 68.140625 C 17.214844 79.683594 26.269531 86.742188 38.328125 90.984375 C 48.921875 93.785156 60.726562 92.4375 70.464844 87.5 C 80.671875 81.265625 87.765625 72.742188 91.09375 61.171875 C 93.78125 48.296875 91.902344 36.089844 84.664062 25.019531 C 77.34375 15.0625 67.566406 10.042969 55.53125 8.074219 C 54.253906 7.890625 52.976562 7.707031 51.699219 7.527344 C 48.671875 7.078125 48.671875 7.078125 46.902344 6.195312 C 46.238281 4.535156 46.238281 4.535156 46.019531 2.65625 C 46.601562 1.777344 47.1875 0.902344 47.789062 0 Z M 47.789062 0 "/><path style=" stroke:none;fill-rule:nonzero;fill:rgb(87,96,106);fill-opacity:1;" d="M 71.273438 21.910156 C 79.183594 28.445312 83.628906 36.742188 84.957031 46.902344 C 85.351562 56.804688 82.726562 65.660156 76.382812 73.339844 C 69.167969 80.855469 60.769531 84.238281 50.519531 84.921875 C 41.691406 85.03125 34.449219 81.753906 27.269531 76.824219 C 19.597656 69.15625 16.097656 61.410156 14.796875 50.8125 C 15.042969 48.671875 15.042969 48.671875 16.8125 47.058594 C 17.394531 46.714844 17.980469 46.371094 18.585938 46.019531 C 22.011719 47.675781 22.011719 47.675781 23.007812 48.671875 C 23.25 50.125 23.46875 51.582031 23.671875 53.042969 C 24.96875 60.332031 27.585938 66.890625 33.636719 71.460938 C 40.988281 76.074219 48.019531 77.085938 56.636719 76.105469 C 63.449219 74.386719 69.183594 70.054688 73.105469 64.273438 C 76.949219 57.011719 77.492188 48.953125 75.519531 40.996094 C 72.722656 33.957031 67.789062 28.472656 60.882812 25.390625 C 53.457031 22.535156 45.230469 23.09375 37.914062 26.015625 C 35.6875 26.742188 34.039062 26.4375 31.859375 25.664062 C 31.566406 24.203125 31.273438 22.742188 30.972656 21.238281 C 42.648438 11.832031 59.488281 13.75 71.273438 21.910156 Z M 71.273438 21.910156 "/><path style=" stroke:none;fill-rule:nonzero;fill:rgb(87,96,106);fill-opacity:1;" d="M 58.683594 32.355469 C 63.761719 35.296875 67.195312 39.578125 69.027344 45.132812 C 69.828125 51.382812 69.320312 56.824219 65.488281 61.945312 C 61.773438 65.898438 58.015625 68.675781 52.492188 69.292969 C 45.210938 69.324219 40.898438 67.738281 35.398438 62.832031 C 33.738281 61.0625 33.738281 61.0625 32.742188 59.292969 C 32.976562 56.632812 33.480469 55.898438 35.398438 53.980469 C 38.367188 54.269531 39.726562 55.4375 41.757812 57.523438 C 45.292969 60.675781 48.429688 61.28125 53.097656 61.0625 C 56.105469 60.675781 56.105469 60.675781 58.40625 59.292969 C 59.636719 57.144531 59.636719 57.144531 60.175781 54.867188 C 60.46875 54.28125 60.761719 53.699219 61.0625 53.097656 C 61.417969 48.488281 61.035156 45.445312 58.40625 41.59375 C 54.578125 38.984375 51.488281 38.363281 46.902344 38.9375 C 44.082031 40.425781 44.082031 40.425781 41.59375 42.476562 C 40.332031 43.464844 40.332031 43.464844 39.046875 44.46875 C 38.429688 44.980469 37.808594 45.492188 37.167969 46.019531 C 35.453125 45.355469 35.453125 45.355469 33.628906 44.246094 C 32.9375 42.601562 32.9375 42.601562 32.742188 40.707031 C 34.941406 36.515625 38.851562 33.445312 43.125 31.558594 C 48.335938 30.042969 53.699219 30.152344 58.683594 32.355469 Z M 58.683594 32.355469 "/></g></svg>`);

		// 这将在左侧功能区中创建一个图标。
		const ribbonIconEl = this.addRibbonIcon('dotcodeIcon', '发布', (evt: MouseEvent) => {
			// 执行查询并获取用户信息
			this.getUserInfo();
			if (this.settings.showArticle) {
				new ArticleModel(this.app, this).open();
			}
		});
		// 使用功能区执行其他操作
		ribbonIconEl.addClass('my-plugin-ribbon-class');


		// 这会在应用底部添加一个状态栏项。不适用于移动应用程序。
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// 这增加了一个简单的命令，可以在任何地方触发
		this.addCommand({
			id: '发布当前笔记',
			name: '发布当前笔记',
			callback: () => {
				// 执行查询并获取用户信息
				this.getUserInfo();
				if (this.settings.showArticle) {
					new ArticleModel(this.app, this).open();
				}
			}
		});
		// 这将添加一个编辑器命令，该命令可以在当前编辑器实例上执行某些操作
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// 这将添加一个复杂的命令，该命令可以检查应用程序的当前状态是否允许执行该命令
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		// 这将添加一个设置选项卡，以便用户可以配置插件的各个方面
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}


	// 尝试登录
	async attemptLogin() {
		try {
			const response = await fetch(this.settings.publishUrl + 'login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username: this.settings.username,
					password: this.settings.password,
					rememberMe: false
				}),
			});

			const result = await response.json();

			if (result.code === 200) {
				// 登录成功，设置用户信息
				this.settings.sessionToken = result.data;
				await this.saveSettings();
				new Notice(result.msg);
			} else {
				// 登录失败，显示错误消息
				new Notice(result.msg || '登录失败');
			}
		} catch (error) {
			console.error('Login error:', error);
			new Notice('请求失败，请检查信息是否正确');
		}
	}

	// 获取用户信息
	async getUserInfo(retry: boolean = true): Promise<any> {
		try {
			const response = await fetch(this.settings.publishUrl + 'system/user/article/info', {
				method: 'GET',
				headers: {
					'Authorization': this.settings.sessionToken,
					'Content-Type': 'application/json',
				}
			});

			const result = await response.json();

			if (result.code === 401 && retry) {
				// 如果返回401且允许重试，尝试重新登录
				await this.attemptLogin();
				// 重新请求当前接口
				// 第二次不再重试，避免无限递归
				return this.getUserInfo(false);
			}

			if (result.code === 200) {
				this.settings.userInfo = result.data;
				await this.saveSettings();
				this.settings.showArticle = true;
			} else {
				this.settings.showArticle = false;
				new Notice(result.msg || '获取用户信息失败');
			}
		} catch (error) {
			this.settings.showArticle = false;
			console.error('UserInfo error:', error);
			new Notice('获取用户信息失败，请检查信息是否正确');
		}
	}

	// 检查文章是否存在
	async checkArticleExistence(title: string, date: string) {
		try {
			const response = await fetch(this.settings.publishUrl + `note/article/exist/state?title=${title}&date=${date}`, {
				method: 'GET',
				headers: {
					'Authorization': this.settings.sessionToken,
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			});
			const result = await response.json();
			if (result.code === 200) {
				console.log('Article existence check result:', result);
				this.settings.checkArticle = result.data;
				this.settings.showArticle = true;
			} else {
				this.settings.showArticle = false;
				new Notice(result.msg || '获取文章存在状态失败');
			}
		} catch (error) {
			this.settings.showArticle = false;
			console.error('checkArticleExistence error:', error);
			new Notice('获取文章存在状态失败，请检查信息是否正确');
		}
	}

	// 上传文件
	async uploadFile(file: TFile): Promise<any> {
		// 读取图片文件内容
		const fileContent = await this.app.vault.readBinary(file);
		// 假设文件是PNG图片
		const blob = new Blob([fileContent], { type: 'image/png' });
		// 创建FormData对象，用于构建表单数据
		const formData = new FormData();
		formData.append('file', blob, file.basename);

		// 创建HTTP请求
		const response = await fetch(this.settings.publishUrl + 'file/image', {
			method: 'POST',
			headers: {
				'Authorization': this.settings.sessionToken,
			},
			body: formData,
		});
		if (!response.ok) {
			throw new Error(`上传失败: ${response.statusText}`);
		}
		const result = await response.json();
		if (result.code != "200") {
			return null
		}
		console.log("输出的数据", result.data)
		return result.data
	}

	//上传文章
	async uploadArticle(article: any,checkArticle:any) {
		try {
			const response = await fetch(this.settings.publishUrl + 'note/article/local/upload', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': this.settings.sessionToken,
				},
				body: JSON.stringify({
					"title": article.title,
					"categories": article.categories,
					"tags": article.tags,
					"original": article.original,
					"date": article.date,
					"updated": article.updated,
					"cover": article.cover,
					"content": article.content,
					"summary": article.summary,
					"isPush": article.isPush,
					"id": checkArticle.id,
				})
			});
			const result = await response.json();
			if (result.code === 200) {
				console.log('uploadArticle:', result)
				new Notice(result.msg);
			} else {
				new Notice(result.msg || '上传文章失败');
			}
		} catch (error) {
			this.settings.showArticle = false;
			console.error('checkArticleExistence error:', error);
			new Notice('上传文章失败，请检查信息是否正确');
		}

	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

// 配置选项
class SampleSettingTab extends PluginSettingTab {
	plugin: DotCodeArticle;

	constructor(app: App, plugin: DotCodeArticle) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h1', {text: 'DotCode'});
		new Setting(containerEl)
			.setName('DotCode地址')
			.setDesc('输入完整地址路径，例如: https://www.dotcode.top/api')
			.addText(text => {
				text.setPlaceholder('输入后台url');
				text.setValue(this.plugin.settings.publishUrl);
				// 当输入框失去焦点时触发 onBlur 事件
				text.inputEl.addEventListener('blur', async () => {
					this.plugin.settings.publishUrl = text.getValue();
					await this.getIndex();
					await this.plugin.saveSettings();
				});
				text.inputEl.style.width = '300px';
			});

		new Setting(containerEl)
			.setName('用户名')
			.setDesc('请输入用户名/邮箱')
			.addText(text => {
				text.setPlaceholder('输入用户名/邮箱');
				text.setValue(this.plugin.settings.username);
				text.onChange(async (value) => {
					this.plugin.settings.username = value;
					await this.plugin.saveSettings();
				});
				text.inputEl.style.width = '300px';
			});

		new Setting(containerEl)
			.setName('密码')
			.setDesc('输入您的密码')
			.addText(text => {
				text.setPlaceholder('输入密码');
				text.setValue(this.plugin.settings.password)
				text.inputEl.type = 'password';
				text.onChange(async (value) => {
					this.plugin.settings.password = value;
					await this.plugin.saveSettings();
				});
				text.inputEl.style.width = '300px';
			});
	}


	// 获取版本
	async getIndex() {
		try {
			const response = await fetch(this.plugin.settings.publishUrl + 'index', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				}
			});
			// 将响应解析为文本字符串
			const responseText = await response.text();
			console.log('Response Text:', responseText);
			new Notice('请求成功');
		} catch (error) {
			console.error('Index error:', error);
			new Notice('请求失败，请检查信息是否正确');
		}
	}


}


class ArticleModel extends Modal {
	plugin: DotCodeArticle;
	article: {
		//标题
		title: string,
		//分类
		categories: string,
		//标签
		tags: [],
		//是否转载
		original: string,
		//创建时间
		date: string,
		//更新时间
		updated: string,
		//封面
		cover: string,
		//内容
		content: string,
		//摘要
		summary: string,
		//是否发布
		isPush: number,
	}

	constructor(app: App, plugin: DotCodeArticle) {
		super(app);
		this.plugin = plugin
	}

	async onOpen() {

		const {contentEl} = this;
		// 创建一个容器，用于将用户信息展示在一行中
		const userInfoContainer = contentEl.createEl('div', {cls: 'user-info-container'});

		// 展示头像
		const avatarImg = userInfoContainer.createEl('img', {
			attr: {
				src: this.plugin.settings.publishUrl + this.plugin.settings.fileUrl + this.plugin.settings.userInfo.avatar,
				alt: '用户头像'
			}
		});

		// 展示用户名
		const usernameEl = userInfoContainer.createEl('div', {
			text: `${this.plugin.settings.userInfo.username}`,
			cls: 'user-info-name'
		});

		// 展示文章数
		const articleCountEl = userInfoContainer.createEl('div', {
			text: `文章: ${this.plugin.settings.userInfo.articleCount}`,
			cls: 'user-info-item'
		});

		// 展示分类数
		const categoryCountEl = userInfoContainer.createEl('div', {
			text: `分类: ${this.plugin.settings.userInfo.categoryCount}`,
			cls: 'user-info-item'
		});

		// 展示标签数
		const tagsCountEl = userInfoContainer.createEl('div', {
			text: `标签: ${this.plugin.settings.userInfo.tagsCount}`,
			cls: 'user-info-item'
		});
		// 获取当前文件的对象
		const currentFile = this.app.workspace.getActiveFile()
		if (currentFile != null && currentFile.extension.endsWith('md')) {
			const file = currentFile;
			// 获取文档内容和元数据
			console.log('当前激活的文件', file)
			// 文件名
			const fileName = file.name;
			// 文件内容
			const fileContent = await this.app.vault.read(file);
			// 创建时间
			const createdTime = file.stat.ctime;
			// 修改时间
			const modifiedTime = file.stat.mtime;
			// 解析 Front Matter 部分的 YAML
			const yamlContent = this.extractFrontMatter(fileContent);
			if (yamlContent) {
				try {
					this.article = parseYaml(yamlContent)
				} catch (e) {
					new Notice(`Failed to parse YAML: ${e.message}`);
				}
			}
			const content = fileContent.replace(/^---[\s\S]*?---\n*/, '');
			if (this.article.title == '' || this.article.title == undefined) {
				this.article.title = fileName.replace(/\.md$/, '');
			}
			this.article.content = content;
			this.article.summary = this.removeMarkdownTags(content).substring(0, 100);

			if (this.article.date == '' || this.article.date == undefined) {
				this.article.date = this.formatTimestampToDateTime(createdTime);
			}
			this.article.updated = this.formatTimestampToDateTime(modifiedTime);
			this.showEditModal(this.article);
			await this.plugin.checkArticleExistence(this.article.title, this.article.date)
		} else {
			this.close();
			new Notice(`没有活动的Markdown笔记`);
		}

		const rowEl = contentEl.createDiv({cls: 'settings-row'});

		if (this.plugin.settings.checkArticle.id) {
			rowEl.createDiv({
				cls: `status-display status-normal`
			});

			rowEl.createDiv({
				text: `最近同步: ${this.plugin.settings.checkArticle.updatedTime}`,
				cls: 'time-display'
			});
		} else {
			rowEl.createDiv({
				cls: `status-display status-default`
			});
		}
		this.article.isPush = this.plugin.settings.checkArticle.isPush == null ? 0 : this.plugin.settings.checkArticle.isPush;
		new Setting(rowEl)
			.addDropdown(dropdown => dropdown
				.addOption('0', '草稿')
				.addOption('1', '发布')
				.setValue(String(this.article.isPush))
				.onChange(async (value) => {
					const numberValue = Number(value);
					this.plugin.settings.checkArticle.isPush = numberValue;
					this.article.isPush = numberValue;
					await this.plugin.saveSettings();
				})
			);

		new Setting(rowEl)
			.addButton(button => {
				button.setButtonText('提交')
					.setCta()
					.onClick(async () => {
						await this.uploadArticle(this.article, this.plugin.settings.checkArticle)
						this.close();
					});
			});


	}

	// 提取 YAML Front Matter
	extractFrontMatter(content: string): string | null {
		const match = content.match(/^---\n([\s\S]*?)\n---/);
		return match ? match[1] : null;
	}

	// 移除 Markdown 标签
	removeMarkdownTags(content: string): string {
		// 使用正则表达式匹配并删除所有 Markdown 标签
		return content.replace(/!\[.*?\]\(.*?\)/g, '')  // 移除图片 ![alt](url)
			.replace(/\[.*?\]\(.*?\)/g, '')   // 移除链接 [text](url)
			.replace(/`{1,3}[\s\S]*?`{1,3}/g, '')  // 移除行内代码块
			.replace(/```[\s\S]*?```/g, '')   // 移除代码块
			.replace(/^\s*#.*$/gm, '')        // 移除标题
			.replace(/^\s*>/gm, '')           // 移除引用
			.replace(/[*_~`]/g, '')           // 移除强调和修饰符号
			.replace(/-{3,}/g, '')            // 移除分割线
			.replace(/^\s*-\s*/gm, '')        // 移除无序列表符号
			.replace(/^\d+\.\s*/gm, '')       // 移除有序列表符号
			.replace(/\n{2,}/g, '\n')         // 移除多余的空行
			.trim();
	}

	// 格式化时间戳为日期和时间
	formatTimestampToDateTime(timestamp: number) {
		const date = new Date(timestamp);
		const [day, month, year] = date.toLocaleDateString('en-GB').split('/');
		const time = date.toLocaleTimeString('en-GB', {hour12: false});
		return `${year}-${month}-${day} ${time}`;
	}

	// 显示当前文章信息
	showEditModal(data: any) {
		const {contentEl} = this;
		contentEl.createEl('hr', {cls: 'hr'});
		// Create form
		const form = contentEl.createEl('form', {cls: 'yaml-form'});

		const fields = [
			{label: '标题', key: 'title', type: 'text'},
			{label: '分类', key: 'categories', type: 'text'},
			{label: '标签', key: 'tags', type: 'text',},
			{label: '封面', key: 'cover', type: 'text'},
			{label: '转载', key: 'original', type: 'text'},
			{label: '描述', key: 'summary', type: 'text'},
			{label: '创建时间', key: 'date', type: 'text'},
			{label: '更新时间', key: 'updated', type: 'text'}
		];
		fields.forEach(field => {
			const container = form.createEl('div', {cls: 'form-group'});
			container.createEl('label', {text: field.label, cls: 'form-label'});
			const input = container.createEl('input', {cls: 'form-input'});
			input.type = field.type;
			input.value = data[field.key] || '';
			input.dataset.key = field.key;
			input.disabled = true;
		});
	}

	// 移除路径前缀 '../'
	removePrefixFromPath(filePath: string): string {
		// 去掉路径前缀 '../'
		return filePath.replace(/^(\.\.\/)+/, '');
	}
	// 上传文章
	async uploadArticle(article: any,checkArticle:any) {
		//先将图片上传
		// 封面
		if(article.cover){
			const file = this.app.vault.getFileByPath(this.removePrefixFromPath(article.cover));
			if (file != null){
				article.cover= await this.plugin.uploadFile(file);
			}
		}
		// 内容
		article.content=await this.uploadImagesAndReplacePaths(article.content);
		console.log("settings",this.plugin.settings)
		console.log("article",article);
		console.log("checkArticle",checkArticle);
		// 调用上传文章接口
		await this.plugin.uploadArticle(article,checkArticle);
	}

	// 上传图片
	async uploadImagesAndReplacePaths(markdownContent: string): Promise<string> {
	    // 使用新的正则表达式匹配本地图片地址
		const imageRegex = /!\[.*?\]\((?!http)(.*?)\)/g;

		// 保存新的 markdown 内容
		let newMarkdownContent = markdownContent;

		// 保存所有匹配到的图片路径
		const imageMatches = [...markdownContent.matchAll(imageRegex)];

		for (const match of imageMatches) {
			// 获取图片的相对路径
			const imagePath = match[1];
			console.log("imagePath",imagePath)
			// 从相对路径获取 TFile 对象
			const tfile = this.app.vault.getAbstractFileByPath(this.removePrefixFromPath(imagePath));

			if (tfile && tfile instanceof TFile) {
				try {
					// 上传图片并获取新地址
					const newImageUrl = await this.plugin.uploadFile(tfile);

					if (newImageUrl) {
						// 构造完整的旧地址
						const oldImageMarkdown = match[0];

						// 构造新的 Markdown 图片语法
						const newImageMarkdown = `![${tfile.basename}](..${newImageUrl})`;

						// 替换文章中的旧地址
						newMarkdownContent = newMarkdownContent.replace(oldImageMarkdown, newImageMarkdown);
					}
				} catch (error) {
					console.error(`Error uploading file: ${tfile.name}`, error);
				}
			} else {
				console.error(`File not found for path: ${imagePath}`);
			}
		}

		// 返回替换了图片地址的新的 markdown 内容
		return newMarkdownContent;
	}
}
