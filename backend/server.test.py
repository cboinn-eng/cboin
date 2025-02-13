

def test_aiAnalysis_import_error(mocker):
    # Mock the import of aiAnalysis module to raise ModuleNotFoundError
    mocker.patch.dict('sys.modules', {'aiAnalysis.aiAnalysis': None})
    mocker.patch('importlib.import_module', side_effect=ModuleNotFoundError("No module named 'pmdarima'"))

    # Attempt to import the module and expect an ImportError
    with pytest.raises(ImportError) as exc_info:
        import aiAnalysis.aiAnalysis

    # Check if the error message contains information about the missing 'pmdarima' module
    assert "No module named 'pmdarima'" in str(exc_info.value)

    # Additional assertion to check if the error message suggests installing pmdarima
    assert "Please install 'pmdarima' to use this module" in str(exc_info.value)
