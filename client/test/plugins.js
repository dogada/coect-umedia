describe('Ensure mocha & chai are configured properly', function() {

  it('should work always', function() {
    expect(true).to.equal(true)
  })

  it('chai-jquery should add .should to jQuery', function() {
    expect(jQuery.should).to.be.a('object')
  })

  it('chai-jquery should redefine `contain` test for jQuery only', function() {
    expect([1,2,3]).to.contain(2)
    expect('Str').to.contain('Str')
    expect($('<p>Test</p>')).contain('Test')
    $('<p>Should test</p>').should.contain('Should test')
  })

})
