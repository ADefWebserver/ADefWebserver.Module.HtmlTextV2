using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace HtmlEditor.Blazor
{
	
	/// <summary>
	/// A component which edits HTML content. Provides built-in upload capabilities.
	/// </summary>
	/// <example>
	/// <code>
	/// &lt;HtmlEditorComponent @bind-Value=@html /&gt;
	/// @code {
	///   string html = "@lt;strong&gt;Hello&lt;/strong&gt; world!"; 
	/// }
	/// </code>
	/// </example>
	public partial class HtmlEditorComponent : FormComponent<string>
    {
        // Parameters for RichTextEditor.razor
        [Parameter]
        public string Content { get; set; }

        [Parameter]
        public bool ReadOnly { get; set; } = false;

       // this is also found in FormComponent and will hide it... commented out for now.
       // [Parameter]
       // public string Placeholder { get; set; }

        [Parameter]
        public bool AllowFileManagement { get; set; } = true;

        [Parameter]
        public bool AllowDesignMode { get; set; } = true;

        [Parameter]
        public bool AllowSourceMode { get; set; } = true;

        // parameters only applicable to rich text editor
        [Parameter]
        public RenderFragment ToolbarContent { get; set; }

        [Parameter]
        public string Theme { get; set; }

        [Parameter]
        public string DebugLevel { get; set; }

        /// <summary>
        /// Specifies whether to show the toolbar. Set it to false to hide the toolbar. Default value is true.
        /// </summary>
        [Parameter]
        public bool ShowToolbar { get; set; } = true;

        /// <summary>
        /// Gets or sets the mode of the editor.
        /// </summary>
        [Parameter]
        public HtmlEditorMode Mode { get; set; } = HtmlEditorMode.Design;

        private HtmlEditorMode mode;

        /// <summary>
        /// Gets or sets the child content.
        /// </summary>
        /// <value>The child content.</value>
        [Parameter]
        public RenderFragment ChildContent { get; set; }

        /// <summary>
        /// Specifies custom headers that will be submit during uploads.
        /// </summary>
        [Parameter]
        public IDictionary<string, string> UploadHeaders { get; set; }

        /// <summary>
        /// Gets or sets the input.
        /// </summary>
        /// <value>The input.</value>
        [Parameter]
        public EventCallback<string> Input { get; set; }

        /// <summary>
        /// A callback that will be invoked when the user pastes content in the editor. Commonly used to filter unwanted HTML.
        /// </summary>
        /// <example>
        /// <code>
        /// &lt;HtmlEditor @bind-Value=@html Paste=@OnPaste /&gt;
        /// @code {
        ///   string html = "@lt;strong&gt;Hello&lt;/strong&gt; world!"; 
        ///   void OnPaste(HtmlEditorPasteEventArgs args)
        ///   {
        ///     // Set args.Html to filter unwanted tags.
        ///     args.Html = args.Html.Replace("&lt;br>&gt;", "");
        ///   }
        /// </code>
        /// </example>
        [Parameter]
        public EventCallback<HtmlEditorPasteEventArgs> Paste { get; set; }

        /// <summary>
        /// A callback that will be invoked when there is an error during upload.
        /// </summary>
        [Parameter]
        public EventCallback<UploadErrorEventArgs> UploadError { get; set; }

        /// <summary>
        /// Called on upload error.
        /// </summary>
        /// <param name="error">The error.</param>
        [JSInvokable("OnError")]
        public async Task OnError(string error)
        {
            await UploadError.InvokeAsync(new UploadErrorEventArgs { Message = error });
        }


        /// <summary>
        /// A callback that will be invoked when the user executes a command of the editor (e.g. by clicking one of the tools).
        /// </summary>
        /// <example>
        /// <code>
        /// &lt;HtmlEditor Execute=@OnExecute&gt;
        ///   &lt;HtmlEditorCustomTool CommandName="InsertToday" Icon="today" Title="Insert today" /&gt;
        /// &lt;/HtmlEditor&gt;
        /// @code {
        ///   string html = "@lt;strong&gt;Hello&lt;/strong&gt; world!"; 
        ///   async Task OnExecute(HtmlEditorExecuteEventArgs args)
        ///   {
        ///     if (args.CommandName == "InsertToday")
        ///     {
        ///       await args.Editor.ExecuteCommandAsync(HtmlEditorCommands.InsertHtml, DateTime.Today.ToLongDateString());
        ///     }
        ///  }
        /// </code>
        /// </example>
        [Parameter]
        public EventCallback<HtmlEditorExecuteEventArgs> Execute { get; set; }

        /// <summary>
        /// Specifies the URL to which HtmlEditor will submit files.
        /// </summary>
        [Parameter]
        public string UploadUrl { get; set; }

        ElementReference ContentEditable { get; set; }
        HtmlEditorTextArea TextArea { get; set; }

        /// <summary>
        /// Focuses the editor.
        /// </summary>
        public override ValueTask FocusAsync()
        {

            if (mode == HtmlEditorMode.Design)
            {
                return ContentEditable.FocusAsync();
            }
            else
            {
                return TextArea.Element.FocusAsync();
            }
        }

        private readonly IDictionary<string, Func<Task>> shortcuts = new Dictionary<string, Func<Task>>();

        internal HtmlEditorCommandState State { get; set; } = new HtmlEditorCommandState();

        async Task OnFocus()
        {
            await UpdateCommandState();
        }

        /// <summary>
        /// Invoked by interop when the HtmlEditor selection changes.
        /// </summary>
        [JSInvokable]
        public async Task OnSelectionChange()
        {
            await UpdateCommandState();
        }

        /// <summary>
        /// Invoked by interop during uploads. Provides the custom headers.
        /// </summary>
        [JSInvokable("GetHeaders")]
        public IDictionary<string, string> GetHeaders()
        {
            return UploadHeaders ?? new Dictionary<string, string>();
        }

        /// <summary>
        /// Executes the requested command with the provided value. Check <see cref="HtmlEditorCommands" /> for the list of supported commands.
        /// </summary>
        /// <param name="name">The name.</param>
        /// <param name="value">The value.</param>
        public async Task ExecuteCommandAsync(string name, string value = null)
        {
            State = await JSRuntime.InvokeAsync<HtmlEditorCommandState>("HtmlEditor.execCommand", ContentEditable, name, value);
            await OnExecuteAsync(name);

            if (Html != State.Html)
            {
                Html = State.Html;

                htmlChanged = true;

                await OnChange();
            }
        }

        /// <summary>
        /// Executes the action associated with the specified shortcut. Used internally by HtmlEditor.
        /// </summary>
        /// <param name="shortcut"></param>
        /// <returns></returns>
        [JSInvokable("ExecuteShortcutAsync")]
        public async Task ExecuteShortcutAsync(string shortcut)
        {
            if (shortcuts.TryGetValue(shortcut, out var action))
            {
                await action();
            }
        }

        private async Task SourceChanged(string html)
        {
            if (Html != html)
            {
                Html = html;
                htmlChanged = true;
            }
            await JSRuntime.InvokeVoidAsync("HtmlEditor.innerHTML", ContentEditable, Html);
            await OnChange();
            StateHasChanged();
        }

        async Task OnChange()
        {
            if (htmlChanged)
            {
                htmlChanged = false;

                await ValueChanged.InvokeAsync(Html);

                if (FieldIdentifier.FieldName != null)
                {
                    EditContext?.NotifyFieldChanged(FieldIdentifier);
                }

                await Change.InvokeAsync(Html);
            }
        }

        internal async Task OnExecuteAsync(string name)
        {
            await Execute.InvokeAsync(new HtmlEditorExecuteEventArgs(this) { CommandName = name });

            StateHasChanged();
        }

        /// <summary>
        /// Saves the current selection. HtmlEditor will lose its selection when it loses focus. Use this method to persist the current selection.
        /// </summary>
        public async Task SaveSelectionAsync()
        {
            await JSRuntime.InvokeVoidAsync("HtmlEditor.saveSelection", ContentEditable);
        }

        /// <summary>
        /// Restores the last saved selection.
        /// </summary>
        public async Task RestoreSelectionAsync()
        {
            await JSRuntime.InvokeVoidAsync("HtmlEditor.restoreSelection", ContentEditable);
        }

        async Task UpdateCommandState()
        {
            State = await JSRuntime.InvokeAsync<HtmlEditorCommandState>("HtmlEditor.queryCommands", ContentEditable);

            StateHasChanged();
        }

        async Task OnBlur()
        {
            await OnChange();
        }

        bool htmlChanged = false;

        bool visibleChanged = false;
        bool firstRender = true;

		/// <inheritdoc />
		protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            await base.OnAfterRenderAsync(firstRender);

            this.firstRender = firstRender;

            if (firstRender || visibleChanged)
            {
                visibleChanged = false;

                if (Visible)
                {
                    await JSRuntime.InvokeVoidAsync("HtmlEditor.createEditor", ContentEditable, UploadUrl, Paste.HasDelegate, Reference, shortcuts.Keys);
                }
            }

            if (valueChanged || visibleChanged)
            {
                valueChanged = false;
                visibleChanged = false;

                Html = Value;

                if (Visible)
                {
                    await JSRuntime.InvokeVoidAsync("HtmlEditor.innerHTML", ContentEditable, Value);
                }
            }
        }

        internal void SetMode(HtmlEditorMode value)
        {
            mode = value;

            StateHasChanged();
        }

        /// <summary>
        /// Returns the current mode of the editor.
        /// </summary>
        public HtmlEditorMode GetMode()
        {
            return mode;
        }

        string Html { get; set; }

        /// <inheritdoc />
        protected override void OnInitialized()
        {
            Html = Value;
            mode = Mode;

            base.OnInitialized();
        }
		
		public async Task<string> GetHtml()
		{
			return Html;
		}

		/// <summary>
		/// Invoked via interop when the value of HtmlEditor changes.
		/// </summary>
		/// <param name="html">The HTML.</param>
		[JSInvokable]
        public void OnChange(string html)
        {
            if (Html != html)
            {
                Html = html;
                htmlChanged = true;
            }
            Input.InvokeAsync(html);
        }

        /// <summary>
        /// Invoked via interop when the user pastes content in HtmlEditor. Invokes <see cref="Paste" />.
        /// </summary>
        /// <param name="html">The HTML.</param>
        [JSInvokable]
        public async Task<string> OnPaste(string html)
        {
            var args = new HtmlEditorPasteEventArgs { Html = html };

            await Paste.InvokeAsync(args);

            return args.Html;
        }

        bool valueChanged = false;

        /// <inheritdoc />
        public override async Task SetParametersAsync(ParameterView parameters)
        {
            if (parameters.DidParameterChange(nameof(Value), Value))
            {
                valueChanged = Html != parameters.GetValueOrDefault<string>(nameof(Value));
            }

            visibleChanged = parameters.DidParameterChange(nameof(Visible), Visible);

            await base.SetParametersAsync(parameters);

            if (visibleChanged && !firstRender && !Visible)
            {
                await JSRuntime.InvokeVoidAsync("HtmlEditor.destroyEditor", ContentEditable);
            }
        }

        /// <inheritdoc />
        protected override string GetComponentCssClass()
        {
            return "html-editor";
        }

        /// <inheritdoc />
        public override void Dispose()
        {
            base.Dispose();

            if (Visible && IsJSRuntimeAvailable)
            {
                JSRuntime.InvokeVoidAsync("HtmlEditor.destroyEditor", ContentEditable);
            }
        }
    }
}
