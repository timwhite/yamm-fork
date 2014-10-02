function startingPageforStandardMerge() {
  var app = UiApp.createApplication().setTitle('Standard mail merge').setWidth(602).setHeight(430);
  var mainPanel = app.createVerticalPanel().setId('mainPanel');
  mainPanel.setStyleAttribute('border', '1px solid #C0C0C0').setWidth(600).setHeight(420);
  var buttonsPanel = app.createHorizontalPanel().setStyleAttribute('margin', '20px').setWidth(500);
  var button = app.createButton('Close', app.createServerHandler('close_'));
  buttonsPanel.setId('buttonsPanel').add(button);
  checkEmailColumn_(app, mainPanel);
  app.add(mainPanel);
  mainPanel.add(buttonsPanel);
  mainPanel.setCellHorizontalAlignment(buttonsPanel, UiApp.HorizontalAlignment.CENTER);
  ss.show(app);
}

function checkEmailColumn_(app, mainPanel) {
  var dataSheet = ss.getActiveSheet();
  var lastColumn = dataSheet.getLastColumn();
  var headers = dataSheet.getRange(1, 1, 1, lastColumn).getValues();
  var emailColumnFound = false;
  var listBox = app.createListBox().addItem('Select...');
  for (var i = 0; i < headers[0].length; i++) {
    listBox.addItem(headers[0][i]);
    if (headers[0][i] == "Email Address") {
      emailColumnFound = true;
    }
  }
  if (!emailColumnFound) {
    var grid = app.createGrid(1, 2);
    grid.setWidget(0, 0, app.createLabel("Which column contains the recipients?"));
    grid.setWidget(0, 1, listBox.setName('emailColumn')).setStyleAttribute('marginLeft', 10);
    var handler = app.createServerHandler('editEmailColumn_').addCallbackElement(mainPanel);
    grid.setStyleAttribute('marginTop', '50px')
    mainPanel.add(grid);
    mainPanel.setCellHorizontalAlignment(grid, UiApp.HorizontalAlignment.CENTER);
    listBox.addChangeHandler(handler);
  }
  else selectDraftInGmail_(app);
}

function editEmailColumn_(e) {
  var dataSheet = ss.getActiveSheet();
  var lastColumn = dataSheet.getLastColumn();
  var headers = dataSheet.getRange(1, 1, 1, lastColumn).getValues();
  for (var i = 0; i < headers[0].length; i++) {
    if (headers[0][i] == e.parameter.emailColumn) {
      dataSheet.getRange(1, i + 1).setValue("Email Address");
    }
  }
  var app = UiApp.getActiveApplication();
  var mainPanel = app.getElementById('mainPanel').clear();
  selectDraftInGmail_(app);
  mainPanel.add(app.getElementById('buttonsPanel'));
  mainPanel.setCellHorizontalAlignment(app.getElementById('buttonsPanel'), UiApp.HorizontalAlignment.CENTER);
  return app;
}

function startStandardMerge_(e) {
  var kind = (e.parameter.items == null) ? 'gmail' : 'docs';
  var selectedTemplate = GmailApp.getThreadById(e.parameter.chosenTemplate).getMessages()[0];
  var user = Session.getEffectiveUser().getEmail();
  var name = e.parameter.chosenName;
  var from = e.parameter.chosenFrom;
  merge(kind, selectedTemplate, name, from);
  
  var app = UiApp.getActiveApplication();
  var mainPanel = app.getElementById('mainPanel').clear();
  var doneLabel = app.createLabel('The merge is done.').setStyleAttribute('fontSize', 20).setStyleAttribute('marginTop', 100);
  mainPanel.add(doneLabel);
  mainPanel.setCellHorizontalAlignment(doneLabel, UiApp.HorizontalAlignment.CENTER);
  return app;
}
