using Microsoft.EntityFrameworkCore;
using Oqtane.Documentation;
using Oqtane.Repository;
using Oqtane.Repository.Databases.Interfaces;
using Oqtane.Modules;

// ReSharper disable MemberCanBePrivate.Global
// ReSharper disable UnusedAutoPropertyAccessor.Global

namespace ADefWebserver.Module.HtmlTextV2.Repository
{
    [PrivateApi("Mark HtmlText classes as private, since it's not very useful in the public docs")]
    public class HtmlTextContext : DBContextBase, ITransientService, IMultiDatabase
    {
        public HtmlTextContext(IDBContextDependencies DBContextDependencies) : base(DBContextDependencies) { }

        public virtual DbSet<Models.HtmlText> HtmlText { get; set; }
    }
}