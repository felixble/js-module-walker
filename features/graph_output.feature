Feature: js-module-walker supports several formats in which it presents its results

  Background:
    Given a directory named "source"
    And a directory named "result"
    And a file named "source/file2.js" with:
    """
    import stuff from './sub/file1';
    import fs from 'fs';
    """
    And a directory named "source/sub"
    And a file named "source/sub/file1.js" with:
    """
    import stuff from '../file2';
    """

  Scenario: Default output is a graph in dot format printed to stdout
    When I run `js-module-walker ./source/file2.js ./source/sub/file1.js`
    Then the output should contain:
    """
    digraph dependencies {
      "file2.js" -> "sub/file1.js"
      "file2.js" -> "fs"
      "sub/file1.js" -> "file2.js"
    }
    """

  Scenario: The result will be written into a file if the --output option is provided
    When I run `js-module-walker --output ./result/dependencies.dot ./source/file2.js`
    Then the file "result/dependencies.dot" should exist
    And the file "result/dependencies.dot" should contain:
    """
    digraph dependencies {
      "file2.js" -> "sub/file1.js"
      "file2.js" -> "fs"
    }
    """

  Scenario: The result will be written into a file if the -o option is provided
    When I run `js-module-walker -o ./result/dependencies.dot ./source/file2.js`
    Then the file "result/dependencies.dot" should exist
    And the file "result/dependencies.dot" should contain:
    """
    digraph dependencies {
      "file2.js" -> "sub/file1.js"
      "file2.js" -> "fs"
    }
    """