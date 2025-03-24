function gerarPagina() {
    const tipo = document.getElementById('pageType').value;
    const entityInput = document.getElementById('entityName').value.trim();
    const fieldsRaw = document.getElementById('fields').value.trim();

    if (!entityInput.includes('-') || !fieldsRaw) {
        alert('Preencha corretamente o nome da entidade (com "-") e os campos.');
        return;
    }

    const [entityCode, entityLabel] = entityInput.split('-').map(p => p.trim());
    const entityPlural = entityCode.endsWith('s') ? entityCode : entityCode + 's';
    const entityKebab = entityCode.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const entityClass = entityCode.charAt(0).toUpperCase() + entityCode.slice(1);

    const fields = fieldsRaw
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.includes('-'))
        .map(l => {
            const [campo, label] = l.split('-').map(p => p.trim());
            return { campo, label };
        });

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
            ? `@{/panel/${entityKebab}/edit/{id}(id=\${${entityCode}.id})}`
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
      th:object="\${${entityCode}}">
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
            return `      updated.set${nomeCampo}(${entityCode}.get${nomeCampo}());`;
        }).join('\n');

        html = `
package com.codes_tech.delivery_manager.controller;

import com.codes_tech.delivery_manager.model.${entityClass};
import com.codes_tech.delivery_manager.repository.${entityClass}Repository;
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

  private final ${entityClass}Repository ${entityCode}Repository;

  public ${entityClass}Controller(${entityClass}Repository ${entityCode}Repository) {
    this.${entityCode}Repository = ${entityCode}Repository;
  }

  @RequestMapping(method = RequestMethod.GET)
  public String listRender(Model model) {
    List<${entityClass}> ${entityPlural} = ${entityCode}Repository.findAll();
    model.addAttribute("${entityPlural}", ${entityPlural});
    return "${entityCode}/index";
  }

  @RequestMapping(path = "/new", method = RequestMethod.GET)
  public String newRender(Model model) {
    model.addAttribute("${entityCode}", new ${entityClass}());
    return "${entityCode}/new";
  }

  @RequestMapping(path = "/edit/{id}", method = RequestMethod.GET)
  public String editRender(@PathVariable Long id, Model model) {
    Optional<${entityClass}> ${entityCode} = ${entityCode}Repository.findById(id);
    if (${entityCode}.isPresent()) {
      model.addAttribute("${entityCode}", ${entityCode}.get());
      return "${entityCode}/edit";
    }
    return "redirect:/panel/${entityKebab}";
  }

  @RequestMapping(path = "/new", method = RequestMethod.POST)
  public String insert(@ModelAttribute ${entityClass} ${entityCode}) {
    ${entityCode}Repository.save(${entityCode});
    return "redirect:/panel/${entityKebab}";
  }

  @RequestMapping(path = "/edit/{id}", method = RequestMethod.POST)
  public String update(@PathVariable Long id, @ModelAttribute ${entityClass} ${entityCode}) {
    Optional<${entityClass}> existing = ${entityCode}Repository.findById(id);
    if (existing.isPresent()) {
      ${entityClass} updated = existing.get();
${setters}
      ${entityCode}Repository.save(updated);
    }
    return "redirect:/panel/${entityKebab}";
  }

  @RequestMapping(path = "/delete/{id}", method = RequestMethod.POST)
  public String delete(@PathVariable Long id) {
    ${entityCode}Repository.deleteById(id);
    return "redirect:/panel/${entityKebab}";
  }
}`.trim();
    }

    document.getElementById('output').value = html;
}
