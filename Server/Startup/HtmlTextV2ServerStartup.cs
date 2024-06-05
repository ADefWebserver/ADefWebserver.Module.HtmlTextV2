using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Oqtane.Infrastructure;
using ADefWebserver.Module.HtmlTextV2.Repository;
using ADefWebserver.Module.HtmlTextV2.Services;
using HtmlEditor;

namespace ADefWebserver.Module.HtmlTextV2.Startup
{
    public class HtmlTextV2ServerStartup : IServerStartup
    {
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // not implemented
        }

        public void ConfigureMvc(IMvcBuilder mvcBuilder)
        {
            // not implemented
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddTransient<IHtmlTextService, ServerHtmlTextService>();
            services.AddDbContextFactory<HtmlTextContext>(opt => { }, ServiceLifetime.Transient);

            services.AddScoped<HtmlEditorDialogService>();
        }
    }
}
