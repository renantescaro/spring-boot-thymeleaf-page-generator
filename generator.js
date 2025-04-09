
function gerarPagina() {
  const tipo = document.getElementById('pageType').value;
  const entityInput = document.getElementById('entityName').value.trim();
  const fieldsRaw = document.getElementById('fields').value.trim();
  const imports = document.getElementById('imports').value;

  if (!entityInput.includes('-') || !fieldsRaw) {
    alert('Preencha corretamente o nome da entidade (com "-") e os campos.');
    return;
  }

  const [entityCode, entityLabel] = entityInput.split('-').map(p => p.trim());
  const entityPlural = (entityCode.endsWith('s') ? entityCode : entityCode + 's').toLowerCase();;
  const entityKebab = entityCode.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  const entityClass = entityCode.charAt(0).toUpperCase() + entityCode.slice(1);
  const entityCamel = entityCode.charAt(0).toLowerCase() + entityCode.slice(1);

  const fields = fieldsRaw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.includes('-'))
    .map(l => {
      const [campo, label, tipo] = l.split('-').map(p => p.trim());
      return { campo, label, tipo };
    });
  console.log('fields', fields)

  let html = '';

  if (tipo === 'index') {
    const ths = fields.map(f => `<th>${f.label}</th>`).join('\n');
    const tds = fields.map(f => `<td th:text="\${item.${f.campo}}">${f.label}</td>`).join('\n');

html = `
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8">
  <title>Listagem de ${entityLabel}</title>
</head>
<body>
  <div th:insert="~{panel}"></div>
  <div>
    <h2>Listagem de ${entityLabel}</h2>
  </div>
  <br><br>

   <a
    class="btn btn-primary"
      href="/panel/${entityKebab}/new"
      >Novo ${entityLabel} +</a>
    <br>

  <table class="table table-striped">
      <thead>
          <tr>
${ths}
              <th>Ações</th>
          </tr>
      </thead>
      <tbody>
          <tr th:each="item : \${${entityPlural}}">
${tds}
              <td>
                  <a class="btn btn-primary"
                     th:href="@{/panel/${entityKebab}/edit/{id}(id=\${item.id})}">
                      Editar
                  </a>
                  <form th:id="'delete-form-' + \${item.id}"
                        th:action="@{/panel/${entityKebab}/delete/{id}(id=\${item.id})}"
                        method="post"
                        style="display: inline;">
                      <button type="button" class="btn btn-danger"
                              th:onclick="'confirmDelete(' + \${item.id} + ')'">
                          Apagar
                      </button>
                  </form>
              </td>
          </tr>
      </tbody>
  </table>

  <p th:if="\${#lists.isEmpty(${entityPlural})}">
      Nenhuma ${entityLabel.toLowerCase()} encontrada.
  </p>

  <script>
      function confirmDelete(itemId) {
          if (confirm("Tem certeza que deseja apagar esta ${entityLabel.toLowerCase()}?")) {
              document.getElementById("delete-form-" + itemId).submit();
          }
      }
  </script>
</body>
</html>`.trim();

  } else if (tipo === 'new' || tipo === 'edit') {
    const isEdit = tipo === 'edit';
    const campos = fields
    .filter(f => f.campo !== 'id')
    .map(f => `
        <div class="mb-6">
          <label for="${f.campo}" class="col-form-label">
              ${f.label}
          </label>
          <input
              type="text" class="form-control"
              name="${f.campo}" id="${f.campo}"
              th:field="*{${f.campo}}" required>
        </div>`).join('\n');

    const title = isEdit ? `Editar ${entityLabel}` : `Nova ${entityLabel}`;
    const action = isEdit
        ? `@{/panel/${entityKebab}/edit/{id}(id=\${${entityCamel}.id})}`
        : `@{/panel/${entityKebab}/new}`;

html = `
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body>
  <div th:insert="~{panel}"></div>

  <h1>${title}</h1>
  <form
      th:action="${action}"
      method="post"
      th:object="\${${entityCamel}}">
      <div class="row" style="margin: 0 30px 0 30px;">
${campos}

          <div class="mb-6">
              <button type="submit" class="btn btn-primary">Salvar</button>
              <a class="btn btn-warning" th:href="@{/panel/${entityKebab}}">
                  Cancelar
              </a>
          </div>
      </div>
  </form>

  <script>
  </script>
</body>
</html>`.trim();

  } else if (tipo === 'controller') {
    const setters = fields.map(f => {
      const nomeCampo = f.campo.charAt(0).toUpperCase() + f.campo.slice(1);
      return `      updated.set${nomeCampo}(${entityCamel}.get${nomeCampo}());`;
    }).join('\n');

html = `
package ${imports}.controller;

import ${imports}.model.${entityClass};
import ${imports}.repository.${entityClass}Repository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/panel/${entityKebab}")
public class ${entityClass}Controller {

  private final ${entityClass}Repository ${entityCamel}Repository;

  public ${entityClass}Controller(${entityCamel}Repository ${entityCamel}Repository) {
    this.${entityCamel}Repository = ${entityCamel}Repository;
  }

  @RequestMapping(method = RequestMethod.GET)
  public String listRender(Model model) {
    List<${entityClass}> ${entityPlural} = ${entityCamel}Repository.findAll();
    model.addAttribute("${entityPlural}", ${entityPlural});
    return "${entityCamel}/index";
  }

  @RequestMapping(path = "/new", method = RequestMethod.GET)
  public String newRender(Model model) {
    model.addAttribute("${entityCamel}", new ${entityClass}());
    return "${entityCamel}/new";
  }

  @RequestMapping(path = "/edit/{id}", method = RequestMethod.GET)
  public String editRender(@PathVariable Long id, Model model) {
    Optional<${entityClass}> ${entityCamel} = ${entityCamel}Repository.findById(id);
    if (${entityCamel}.isPresent()) {
      model.addAttribute("${entityCamel}", ${entityCamel}.get());
      return "${entityCamel}/edit";
    }
    return "redirect:/panel/${entityKebab}";
  }

  @RequestMapping(path = "/new", method = RequestMethod.POST)
  public String insert(@ModelAttribute ${entityClass} ${entityCamel}) {
    ${entityCamel}Repository.save(${entityCamel});
    return "redirect:/panel/${entityKebab}";
  }

  @RequestMapping(path = "/edit/{id}", method = RequestMethod.POST)
  public String update(@PathVariable Long id, @ModelAttribute ${entityClass} ${entityCamel}) {
    Optional<${entityClass}> existing = ${entityCamel}Repository.findById(id);
    if (existing.isPresent()) {
      ${entityClass} updated = existing.get();
${setters}
      ${entityCamel}Repository.save(updated);
    }
    return "redirect:/panel/${entityKebab}";
  }

  @RequestMapping(path = "/delete/{id}", method = RequestMethod.POST)
  public String delete(@PathVariable Long id) {
    ${entityCamel}Repository.deleteById(id);
    return "redirect:/panel/${entityKebab}";
  }
}`.trim();
  } else if (tipo === 'entity') {
    const packageName = document.getElementById('imports').value.trim();

    const atributos = fields.map(f => {
      if (f.campo === 'id') {
          return `      @Id\n      @GeneratedValue(strategy = GenerationType.IDENTITY)\n      private Long id;`;
      }
      return `      @Column(nullable = false)\n      private ${f.tipo || 'String'} ${f.campo};`;
    }).join('\n\n');

    const gettersSetters = fields.map(f => {
      const campoUpper = f.campo.charAt(0).toUpperCase() + f.campo.slice(1);
      const tipoCampo = f.campo === 'id' ? 'Long' : f.tipo || 'String';

          return `
      public ${tipoCampo} get${campoUpper}() {
          return this.${f.campo};
      }

      public void set${campoUpper}(${tipoCampo} ${f.campo}) {
          this.${f.campo} = ${f.campo};
      }`;
    }).join('\n');

html = `
package ${packageName}.model;

import jakarta.persistence.*;

@Entity
public class ${entityClass} {

${atributos}

${gettersSetters}

}`.trim();
}

  document.getElementById('output').value = html;
}
