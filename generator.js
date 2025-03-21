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
  <h1>Listagem de ${entityLabel}</h1>
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
        const campos = fields.map(f => `            <div class="mb-6">
              <label for="${f.campo}" class="col-form-label">
                  ${f.label}
              </label>
              <input
                  type="text" class="form-control"
                  name="${f.campo}" id="${f.campo}"
                  th:field="*{${f.campo}}" required>
          </div>`).join('\n\n');

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
    }

    document.getElementById('output').value = html;
}
